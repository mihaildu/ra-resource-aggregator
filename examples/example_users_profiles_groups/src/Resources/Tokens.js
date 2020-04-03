import React from "react";
import {
  Resource,
  List,
  Datagrid,
  NumberField,
  TextField,
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  Create
} from "react-admin";

import HiddenInput from "./common/HiddenInput";

const TokensList = props => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <NumberField source="key" />
      <TextField source="value" />
    </Datagrid>
  </List>
);

const TokensEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <HiddenInput>
        <NumberInput source="key" disabled />
      </HiddenInput>
      <TextInput source="value" />
    </SimpleForm>
  </Edit>
);

const TokensCreate = props => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="value" />
    </SimpleForm>
  </Create>
);

const Tokens = {
  resourceName: "tokens",
  resource: (
    <Resource
      name={"tokens"}
      list={TokensList}
      edit={TokensEdit}
      create={TokensCreate}
      options={{ label: "Tokens" }}
    />
  ),
  dataProviderMappings: {
    LIST: {
      tokens: {
        main: true,
        fields: ['key', 'value'],
        key: data => data.key,
        keyField: 'key'
      }
    },
    EDIT: {
      tokens: {
        main: true,
        fields: ['key', 'value'],
        key: data => data.key,
        keyField: 'key'
      }
    },
    CREATE: {
      tokens: {
        main: true,
        fields: ['key', 'value'],
        key: data => data.key
        //keyField: 'key'
      }
    },
    DELETE: {
      tokens: {
        main: true,
        fields: [],
        key: data => data.key
        //keyField: 'key'
      }
    }
  }
};

export default Tokens;
