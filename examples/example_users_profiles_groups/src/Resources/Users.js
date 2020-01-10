import React from "react";
import {
  Resource,
  List,
  Datagrid,
  TextField,
  Edit,
  SimpleForm,
  TextInput,
  Create
} from "react-admin";

const UsersList = props => (
  <List {...props}>
      <Datagrid rowClick="edit">
        <TextField source="username" />
        <TextField source="email" />        
      </Datagrid>
    </List>
);

const UsersEdit = props => (
  <Edit {...props}>
      <SimpleForm>
        <TextInput source="username" />
        <TextInput source="email" />
      </SimpleForm>
  </Edit>
);

const UsersCreate = props => (
  <Create {...props}>
      <SimpleForm>
        <TextInput source="username" />
        <TextInput source="email" />
      </SimpleForm>
  </Create>
);

const Users = {
  resourceName: "users",
  resource: (
    <Resource
      name="users"
      list={UsersList}
      edit={UsersEdit}
      create={UsersCreate}
      options={{ label: "Users" }}
    />
  )
};

export default Users;
