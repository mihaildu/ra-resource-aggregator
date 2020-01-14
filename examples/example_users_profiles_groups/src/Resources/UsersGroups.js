import React from "react";
import {
  Resource,
  List,
  Datagrid,
  TextField,
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  Create,
  ReferenceArrayInput,
  SelectArrayInput
} from "react-admin";

import HiddenInput from "./common/HiddenInput";

const UsersGroupsList = props => (
  <List {...props}>
      <Datagrid rowClick="edit">
        <TextField source="username" />
      </Datagrid>
    </List>
);

const UsersGroupsEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <HiddenInput>
        <NumberInput source="users_groups_id" disabled />
      </HiddenInput>
      <TextInput source="username" />
      <TextInput source="email" />
      <ReferenceArrayInput
        source="group_id"
        reference="groups"
        label="Groups"
      >
        <SelectArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Edit>
);

const UsersGroupsCreate = props => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="username" />
      <ReferenceArrayInput
        source="group_id"
        reference="groups"
        label="Groups"
      >
        <SelectArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Create>
);

const UsersGroups = {
  resourceName: "users_groups",
  resource: (
    <Resource
      name={"users_groups"}
      list={UsersGroupsList}
      edit={UsersGroupsEdit}
      create={UsersGroupsCreate}
      options={{ label: "Users Groups" }}
    />
  ),
  dataProviderMappings: {
    LIST: {
      users: {
        main: true,
        fields: ['id', 'username'],
        key: data => data.id
      }
    },
    EDIT: {
      users: {
        main: true,
        fields: ['id', 'username', 'email'],
        key: data => data.id
      },
      users_groups: {
        main: false,
        fields: [
          { name: 'id', alias: 'users_groups_id' },
          'group_id'
        ],
        key: data => data.user_id,
        getForeignKey: id => ({
          user_id: parseInt(id)
        }),
        accumulate: true
      }
    },
    CREATE: {
      users: {
        main: true,
        initData: oldData =>
          Object.assign({}, oldData, {
            date_created: new Date(Date.now())
          }),
        fields: ['username', 'email'],
        key: data => data.id
      },
      users_groups: {
        main: false,
        fields: [
          { name: 'id', alias: 'users_groups_id' },
          'group_id'
        ],
        key: data => data.user_id,
        getForeignKey: id => ({
          user_id: parseInt(id)
        }),
        accumulate: true
      }
    },
    DELETE: {
      users: {
        main: true,
        fields: [],
        key: data => data.id
      },
      users_groups: {
        main: false,
        fields: [ { name: 'id', alias: 'users_groups_id' } ],
        getId: data => data.users_groups_id,
        key: data => data.user_id,
        accumulate: true
      }
    }
  }
};

export default UsersGroups;
