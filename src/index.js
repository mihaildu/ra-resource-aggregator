class DataProvider {
  constructor(props) {
    // TODO props validation
    const {
      dataProvider,
      resources,
      paramsPatch
    } = props;

    this.paramsPatch = paramsPatch;
    this.dataProvider = dataProvider;

    this.resourceMappings = {};
    for (let resourceName in resources) {
      const resource = resources[resourceName];
      if (!resource.resourceName || !resource.dataProviderMappings) {
        continue;
      }
      this.resourceMappings[resource.resourceName] =
        resource.dataProviderMappings;
    }

    this.actionHandlers = {
      GET_LIST: this.handleGetList,
      GET_ONE: this.handleGetOne,
      UPDATE: this.handleUpdate,
      CREATE: this.handleCreate,
      DELETE: this.handleDelete,
      DELETE_MANY: this.handleDeleteMany
    };
  }

  actionToMappingType = {
    GET_LIST: 'LIST',
    GET_ONE: 'EDIT',
    UPDATE: 'EDIT',
    CREATE: 'CREATE',
    DELETE: 'DELETE',
    DELETE_MANY: 'DELETE'
  };

  provideData = (type, resource, params) => {
    const newParams = this.paramsPatch(type, params);
    const mappings = this.resourceMappings[resource];
    const mappingType = this.actionToMappingType[type];

    if (mappings && mappingType) {
      return this.actionHandlers[type](newParams, mappings[mappingType]);
    }
    return this.dataProvider(type, resource, newParams);
  };

  handleGetList = async (params, tables) => {
    const { queries, totalRecords } = await this.runGetQueries({
      mainType: 'GET_LIST',
      params,
      tables,
      getTotal: true
    });

    const total = await totalRecords;
    const result = await this.handleGetQueries(queries, tables);
    const data = Object.values(result);
    return {
      data,
      total
    };
  };

  handleGetOne = async (params, tables) => {
    const { queries } = await this.runGetQueries({
      mainType: 'GET_ONE',
      params,
      tables,
      getTotal: false
    });

    const result = await this.handleGetQueries(queries, tables);
    const data = Object.values(result)[0];
    // going back from array to object & adding id required by react-admin
    return {
      data: Object.assign({}, data, { id: parseInt(params.id) })
    };
  };

  hasAccumulateTable = tables => {
    for (let tableName in tables) {
      if (tables[tableName].accumulate) {
        return true;
      }
    }
    return false;
  };

  getNonIdColumn = data => {
    for (let key in data) {
      if (key !== 'id') {
        return key;
      }
    }
    return null;
  };

  buildHashForData = data => {
    const dataHash = {};
    for (let index in data) {
      const value = data[index];
      dataHash[value] = true;
    }
    return dataHash;
  };

  createDiff = (data, previousData) => {
    /**
     * Generates list of new records to add to db
     */
    const nonIdColumn = this.getNonIdColumn(data);
    const dataHash = previousData
      ? this.buildHashForData(previousData[nonIdColumn])
      : {};

    const recordsToAdd = [];
    for (let index in data[nonIdColumn]) {
      const value = data[nonIdColumn][index];
      if (!dataHash[value]) {
        const recordToAdd = {};
        for (let key in data) {
          if (key === 'id') {
            continue;
          }
          recordToAdd[key] = data[key][index];
        }
        recordsToAdd.push(recordToAdd);
      }
    }
    return recordsToAdd;
  };

  deleteDiff = (previousData, data) => {
    /**
     * Generates list of ids to delete from db
     */
    if (!previousData) {
      return [];
    }

    const nonIdColumn = this.getNonIdColumn(previousData);
    const dataHash = this.buildHashForData(data[nonIdColumn]);

    const idsToDelete = [];
    for (let index in previousData[nonIdColumn]) {
      const value = previousData[nonIdColumn][index];
      if (!dataHash[value]) {
        idsToDelete.push(previousData.id[index]);
      }
    }

    return idsToDelete;
  };

  runAccumulateQueries = (params, table, tableName) => {
    const idsToDelete = this.deleteDiff(table.previousData, table.data);
    idsToDelete.forEach(id => {
      this.dataProvider('DELETE', tableName, {
        id,
        previousData: {}
      });
    });

    let queries = [];
    let newRecords = this.createDiff(table.data, table.previousData);
    newRecords.forEach(record => {
      const query = this.dataProvider('CREATE', tableName, {
        data: Object.assign({}, record, table.getForeignKey(params.id))
      });
      queries.push(query);
    });

    const newIds = [];
    for (let index in table.data.id) {
      const newId = table.data.id[index];
      if (idsToDelete.includes(newId)) {
        continue;
      }
      newIds.push(newId);
    }

    return Promise.all(queries).then(results => {
      results.forEach(result => {
        newIds.push(result.data.id);
      });
      return {
        data: {
          ...table.data,
          id: newIds
        }
      };
    });
  };

  handleUpdate = async (params, tables) => {
    this.disaggregateData(params, tables, 'data');
    if (this.hasAccumulateTable(tables)) {
      /**
       * We need previousData for many-to-many relationships
       * TODO(mihail): we should build previousData only for accumulate
       * table but I don't consider this to be a big overhead for now
       */
      this.disaggregateData(params, tables, 'previousData');
    }

    const { queries } = await this.runUpdateQueries({ params, tables });

    // clear table.data
    for (let tableName in tables) {
      tables[tableName].data = {};
    }

    const result = await this.handleUpdateQueries(queries, tables);
    const data = Object.values(result)[0];
    const id = parseInt(Object.keys(result)[0]);
    return {
      id,
      data: Object.assign({}, data, { id })
    };
  };

  initParamsData = (params, tables) => {
    let newParams = params;
    for (let tableName in tables) {
      const table = tables[tableName];
      if (table.initData) {
        newParams = Object.assign({}, params, {
          data: table.initData(params.data)
        });
      }
    }
    return newParams;
  };

  handleCreate = async (params, tables) => {
    const newParams = this.initParamsData(params, tables);
    this.disaggregateData(newParams, tables, 'data');

    const {
      mainTableData,
      mainTableName,
      queries
    } = await this.runCreateQueries({ tables });

    // clear table.data
    for (let tableName in tables) {
      tables[tableName].data = {};
    }

    const result = await this.handleCreateQueries(
      queries,
      tables,
      mainTableData,
      mainTableName
    );
    const data = Object.values(result)[0];
    const id = parseInt(Object.keys(result)[0]);
    return {
      data: Object.assign({}, data, { id })
    };
  };

  handleDelete = async (params, tables) => {
    return this.runDeleteQueries({ params, tables });
  };

  handleDeleteMany = async (params, tables) => {
    const getQueries = [];
    const deleteQueries = [];
    params.ids.forEach(id => {
      getQueries.push(this.handleGetOne({ id }, tables));
    });

    const records = await Promise.all(getQueries);
    records.forEach(record => {
      deleteQueries.push(
        this.handleDelete(
          { id: record.data.id, previousData: record.data },
          tables
        )
      );
    });

    const results = await Promise.all(deleteQueries);
    return {
      data: results.map(result => result.data.id)
    };
  };

  runGetQueries = ({ mainType, params, tables, getTotal = false }) => {
    const queries = [];
    let totalRecords = 0;
    for (let tableName in tables) {
      const table = tables[tableName];

      let query;
      let newParams = params;
      if (table.params) {
        newParams = table.params(params);
      }
      if (table.main) {
        query = this.dataProvider(mainType, tableName, newParams);
        if (getTotal) {
          totalRecords = this.getAllRecords({
            tableName,
            filter: newParams.filter
          }).then(res => res.data.length);
        }
      } else {
        // TODO maybe filter here...
        query = this.getAllRecords({ tableName });
      }
      queries.push({
        query,
        tableName
      });
    }

    return {
      queries,
      totalRecords
    };
  };

  handleGetQueries = async (queries, tables) => {
    const queryPromises = queries.map(query => query.query);
    const tableNames = queries.map(query => query.tableName);
    const tablesData = await Promise.all(queryPromises);
    this.storeTablesData(tablesData, tableNames, tables);
    return this.aggregateData(tables);
  };

  runUpdateQueries = ({ params, tables }) => {
    /**
     * I just need the data to be updated
     * no previousData
     */
    const queries = [];
    for (let tableName in tables) {
      let query;
      const table = tables[tableName];
      if (!table.accumulate) {
        query = this.runNonAccumulateUpdateQuery(table, tableName, params);
      } else {
        query = this.runAccumulateQueries(params, table, tableName);
      }
      queries.push({
        query,
        tableName
      });
    }
    return {
      queries
    };
  };

  runNonAccumulateUpdateQuery = (table, tableName, params) => {
    let id;
    if (table.main) {
      id = params.id;
    } else {
      id = table.data.id;
    }
    return this.dataProvider('UPDATE', tableName, {
      id,
      data: table.data
    });
  };

  handleUpdateQueries = async (queries, tables) => {
    const queryPromises = queries.map(query => query.query);
    const tableNames = queries.map(query => query.tableName);

    // aggregate again and return result
    const tablesData = await Promise.all(queryPromises);
    this.storeTablesData(tablesData, tableNames, tables);
    return this.aggregateData(tables);
  };

  runCreateQueries = async ({ tables }) => {
    let mainTable;
    let mainTableName;
    for (let tableName in tables) {
      if (tables[tableName].main) {
        mainTable = tables[tableName];
        mainTableName = tableName;
        break;
      }
    }
    const mainTableResult = await this.dataProvider(
      'CREATE',
      mainTableName,
      {
        data: mainTable.data
      }
    );

    // run all other creates
    const queries = [];
    for (let tableName in tables) {
      const table = tables[tableName];
      if (table.main) {
        continue;
      }

      let query;
      if (table.accumulate) {
        query = this.runAccumulateQueries(
          { id: mainTableResult.data.id },
          table,
          tableName
        );
      } else {
        query = this.dataProvider('CREATE', tableName, {
          data: Object.assign(
            {},
            table.data,
            table.getForeignKey(mainTableResult.data.id)
          )
        });
      }
      queries.push({
        query,
        tableName
      });
    }

    return {
      mainTableData: mainTableResult,
      mainTableName,
      queries
    };
  };

  handleCreateQueries = async (
    queries,
    tables,
    mainTableData,
    mainTableName
  ) => {
    const queryPromises = queries.map(query => query.query);
    const tableNames = queries.map(query => query.tableName);
    const tablesData = await Promise.all(queryPromises);

    tablesData.push(mainTableData);
    tableNames.push(mainTableName);
    this.storeTablesData(tablesData, tableNames, tables);
    return this.aggregateData(tables);
  };

  runDeleteQueries = ({ params, tables }) => {
    // delete from all other tables
    for (let tableName in tables) {
      const table = tables[tableName];
      if (table.main) {
        continue;
      }

      if (table.accumulate) {
        const idsToDelete = table.getId(params.previousData);
        idsToDelete.forEach(id => {
          this.dataProvider('DELETE', tableName, {
            id,
            previousData: {}
          });
        });
      } else {
        this.dataProvider('DELETE', tableName, {
          id: table.getId(params.previousData),
          previousData: {}
        });
      }
    }

    // delete from main table
    for (let tableName in tables) {
      if (tables[tableName].main) {
        return this.dataProvider('DELETE', tableName, {
          id: params.id,
          previousData: {}
        });
      }
    }

    // no main table - should not happen
    return { data: null };
  };

  storeTablesData = (tablesData, tableNames, tables) => {
    tablesData.forEach(({ data: tableData }, index) => {
      const tableName = tableNames[index];
      const table = tables[tableName];
      if (!Array.isArray(tableData)) {
        table.data = [tableData];
      } else {
        table.data = tableData;
      }
    });
  };

  addColumnData = ({
    aggregatedData,
    row,
    key,
    column,
    accumulate = false
  }) => {
    let srcColumn, dstColumn;
    if (typeof column === 'string') {
      dstColumn = column;
      srcColumn = column;
    } else {
      dstColumn = column.alias;
      srcColumn = column.name;
    }

    if (accumulate) {
      if (aggregatedData[key][dstColumn]) {
        aggregatedData[key][dstColumn].push(row[srcColumn]);
      } else {
        aggregatedData[key][dstColumn] = [row[srcColumn]];
      }
    } else {
      aggregatedData[key][dstColumn] = row[srcColumn];
    }
  };

  aggregateData = tables => {
    /**
     * Aggregate data from table.data, for each table in tables
     * table.data contains rows with all the columns
     * table.columns specifies which columns to aggregate
     */
    const aggregatedData = {};

    let mainTable = Object.values(tables).find(table => table.main === true);
    mainTable.data.forEach(row => {
      const key = mainTable.key(row, tables);
      aggregatedData[key] = {};
      mainTable.columns.forEach(column => {
        this.addColumnData({
          aggregatedData,
          row,
          key,
          column,
          accumulate: false
        });
      });
    });

    // aggregate all other table data
    for (let tableName in tables) {
      const table = tables[tableName];
      if (table.main) {
        continue;
      }

      table.data.forEach(row => {
        const key = table.key(row, tables);
        if (!aggregatedData[key]) {
          // row has no relation with main table data
          return;
        }

        table.columns.forEach(column => {
          this.addColumnData({
            aggregatedData,
            row,
            key,
            column,
            accumulate: table.accumulate
          });
        });
      });
    }
    return aggregatedData;
  };

  disaggregateData = (params, tables, key) => {
    /**
     * Splits data from params into tables (table.data)
     *   key should be 'data' or 'previousData'
     */
    for (let tableName in tables) {
      tables[tableName][key] = {};
    }
    for (let paramName in params[key]) {
      this.updateParamInTables(paramName, params[key], tables, key);
    }
  };

  updateParamInTables = (paramName, paramsData, tables, key) => {
    /**
     * Looks for paramName in tables and
     * updates table.data with its value
     */
    for (let tableName in tables) {
      const table = tables[tableName];
      for (let colName of table.columns) {
        if (typeof colName === 'string' && colName === paramName) {
          table[key][colName] = paramsData[paramName];
          return;
        } else if (colName.alias === paramName) {
          table[key][colName.name] = paramsData[paramName];
          return;
        }
      }
    }
  };

  getAllRecords = ({ tableName, filter = {} }) => {
    return this.dataProvider('GET_LIST', tableName, {
      pagination: { page: 1, perPage: 1 },
      sort: { field: 'id', order: 'DESC' },
      filter
    }).then(res => {
      return this.dataProvider('GET_LIST', tableName, {
        pagination: { page: 1, perPage: res.total },
        sort: { field: 'id', order: 'DESC' },
        filter
      });
    });
  };
}

export default DataProvider;
