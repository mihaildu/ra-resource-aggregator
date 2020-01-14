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
  Create
} from "react-admin";

import HiddenInput from "./common/HiddenInput";

const UserProfilesList = props => (
  <List {...props}>
      <Datagrid rowClick="edit">
        <TextField source="username" />
        <TextField source="email" />
        <TextField source="first_name" />
        <TextField source="last_name" />
      </Datagrid>
    </List>
);

const UserProfilesEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <HiddenInput>
        <NumberInput source="user_id" disabled />
        <NumberInput source="profiles_id" disabled />
      </HiddenInput>
      <TextInput source="username" />
      <TextInput source="email" />
      <TextInput source="first_name" />
      <TextInput source="last_name" />
    </SimpleForm>
  </Edit>
);

const UserProfilesCreate = props => (
  <Create {...props}>
      <SimpleForm>
        <TextInput source="username" />
        <TextInput source="email" />
        <TextInput source="first_name" />
        <TextInput source="last_name" />
      </SimpleForm>
  </Create>
);

const UserProfiles = {
  resourceName: "users_profiles",
  resource: (
    <Resource
      name={"users_profiles"}
      list={UserProfilesList}
      edit={UserProfilesEdit}
      create={UserProfilesCreate}
      options={{ label: "User Profiles" }}
    />
  ),
  dataProviderMappings: {
    LIST: {
      users: {
        main: true,
        fields: ['id', 'username', 'email'],
        key: data => data.id
      },
      profiles: {
        main: false,
        fields: ['first_name', 'last_name', 'user_id'],
        key: data => data.user_id
      }
    },
    EDIT: {
      users: {
        main: true,
        fields: ['id', 'username', 'email'],
        key: data => data.id
      },
      profiles: {
        main: false,
        fields: [
          { name: 'id', alias: 'profiles_id' },
          'first_name',
          'last_name',
          'user_id'
        ],
        key: data => data.user_id
      }
    },
    CREATE: {
      users: {
        main: true,
        initData: oldData =>
          Object.assign({}, oldData, {
            date_created: new Date(Date.now())
          }),
        fields: ['username', 'email', 'date_created'],
        key: data => data.id
      },
      profiles: {
        main: false,
        fields: [
          'first_name',
          'last_name',
          'user_id'
        ],
        key: data => data.user_id,
        getForeignKey: id => ({
          user_id: parseInt(id)
        })
      }
    },
    DELETE: {
      users: {
        main: true,
        fields: [],
        key: data => data.id
      },
      profiles: {
        main: false,
        fields: [ { name: 'id', alias: 'profiles_id' } ],
        getId: data => data.profiles_id,
        key: data => data.user_id,
      }
    }
  }
};

export default UserProfiles;
