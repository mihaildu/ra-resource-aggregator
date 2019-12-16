Resource aggregator for react-admin.

This is useful if you use a data provider that does one to one mapping between
react-admin resources and backend entities (e.g. tables), like hasura does.
You might want to map a single resource to several backend entities for listing,
editing and creating. This is where this package is useful, it allows you to use
data from multiple entities in the list/edit/create views.

This package was tested only with `react-admin@2.6.2` and `ra-data-hasura@0.0.2`.
Anything else might not work. There is an open issue about running compatibility
tests here https://github.com/dryhten/ra-resource-aggregator/issues/1

## Basic example

Let's take an example: we have a database with 2 tables, `users` and `profiles`.
In `users` we have the `username` & `email` columns, in `profiles` we have
`first_name`, `last_name` & `user_id`. We want to create a new react admin
resource called `User Profiles` that allows us to view `username`, `email`,
`first_name` and `last_name`, edit them and create new ones (both users and
profiles).

First we can use something like hasura to expose a GraphQL API to perform
basic CRUD on the database. We can then add `ra-data-hasura` to map react-admin
resources and actions to database tables and operations.

We can create the view component similar to this:
```
const UserProfilesList = props => {
  return (
    <List {...props}>
      <Datagrid rowClick="edit">
        <ReferenceField source="user_id" reference="users">
          <TextField source="username" />
          <TextField source="email" />
        </ReferenceField>
        <TextField source="first_name" />
        <TextField source="last_name" />
      </Datagrid>
    </List>
  );
};
```

However, if we want to create an edit view that allows us to change both fields
from users (username, email) and profiles (first_name, last_name) in one page
it wouldn't be possible in a straightforward way with react-admin.

With this package you can do the data mappings and write an edit view like this:
```
const UserProfilesEdit = props => {
  return (
    <Edit {...props}>
      <Datagrid rowClick="edit">
        <TextInput source="username" />
        <TextInput source="email" />
        <TextInput source="first_name" />
        <TextInput source="last_name" />
      </Datagrid>
    </Edit>
  );
};
```

To do the data mappings you'd have to write an object like this:
```
dataProviderMappings: {
    LIST: {
      users: {
        main: true,
        params: oldParams => oldParams,
        fields: ['id', 'username', 'email'],
        key: data => data.id
      },
      profiles: {
        main: false,
        params: oldParams => oldParams,
        fields: [
          'first_name',
          'last_name',
          'user_id'
        ],
        key: data => data.user_id
      }
    },
    EDIT: {
      users: {
        main: true,
        params: oldParams => oldParams,
        fields: ['id', 'username', 'email'],
        key: data => data.id
      },
      profiles: {
        main: false,
        params: oldParams => oldParams,
        fields: [
          'first_name',
          'last_name',
          'user_id'
        ],
        key: data => data.user_id
      }
    }
}
```

## Setup

You need react-admin v2 for this.

Install with npm
```
npm install ra-resource-aggregator
```
or with yarn
```
yarn add ra-resource-aggregator
```

Then in your app:
```
import ResourceAggregator from 'ra-resource-aggregator';
import * as Resources from './Resources';

this.resourceAggregator = new ResourceAggregator({
  dataProvider: ...
  resources: Resources
  paramsPatch: ...
    });
```

You can use the data provider of your choice for `dataProvider`. `paramsPatch`
is an optional prop that can be a function to be applied to params everytime
a new action is run by react-admin (e.g. data type conversions for arrays if
your backend is a PostgreSQL database).

`Resources` is a list of objects that follow a specific format:
```
const MyResource = {
  resourceName: 'MyResource',
  resource: (
    <Resource
      name="MyResource"
      list={MyResourceList}
      edit={MyResourceEdit}
      create={MyResourceCreate}
      options={{ label: LABEL }}
    />
  ),
  dataProviderMappings: {
    LIST: {
      resource1: {
        main: true,
        params: oldParams => oldParams,
        fields: ['id', ...],
        key: data => data.id
      },
      resource2: {
        main: false,
        params: oldParams => oldParams,
        fields: [...],
        key: data => {... return id;}
      }
      ...
    },
    EDIT: {
      resource1: {
        ...
      },
      resource2: {
        ...
      }
    },
    CREATE: {
      resource1: {
        ...
      },
      resource2: {
        ...
      }
    },
    DELETE: {
      resource1: {
        ...
      },
      resource2: {
        ...
      }
    }
  }
};

export default MyResource
```

The `dataProvierMappings` has the following props:

`LIST` / `EDIT` / `CREATE` / `DELETE`: objects that specify which resources and
fields to use for the list/edit/create view and when deleting objects.

Each of these have a list of resource names to use. For each resource you must
specify a list of props based on mapping type (LIST, EDIT etc).

#### LIST mapping

`main`: true/false, specifiy if the resource is the main/primary resource. For
example if the backend is a database this would be the table from where we get
all our rows, having other data joining the result from other tables via foreign
keys.

`params`: function that will be applied to `GET_LIST` params before they are
sent to data provider (e.g. filtering, pagination etc).

`fields`: what fields to use for this resource. For example, if the backend is
a database, what columns to get.

`key`: function that returns a unique id for each row. Normally this would
always return `data.id` for main table. For other tables, this should return
the foreign key field (e.g. `data.profile_id`). This is used when performing
the aggregation from different resources and uniquely identifies the record
where data is merged.

#### EDIT

The props are similar to `LIST`. One difference is that every non-main resource
must include the `id` field in `fields`. The thing is that every field must be
a unique string (since it's aggregated), so `fields` supports the following
format

```
fields: [ { name: 'id', alias: 'profile_id' } ]
```

#### CREATE

Similar props. `params` function is not needed. There is an extra optional prop
`initData` that can initialize data for a specific resource (e.g. adding
`data_created` to form data).

```
initData: oldData =>
  Object.assign({}, oldData, {
    date_created: new Date(Date.now()),
    date_modified: new Date(Date.now())
})
```

Every non-main table must specify an additional `getForeignKey` prop that
receives the id of the record in the main resource after insertion and must
return an object with one prop that represents the field where the id of the
main table record is stored. In our SQL example, for the table `profile` this
would be
```
getForeignKey: id => ({
  profile_id: id
})
```

#### DELETE

Props needed: `main`, `fields` - can be empty array for main table. For non-main
tables it must include id. `key` - the same as above.

A new prop is `getId` for non-main tables that should return the id of the
non-main record from the aggregated data, so something like
```
getId: data => data.profile_id,
```

TODO describe `accumulate`

TODO add full working example

TODO add table with every prop + required/optional + short description