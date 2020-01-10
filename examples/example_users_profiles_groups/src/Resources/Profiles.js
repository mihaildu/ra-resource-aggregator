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

const ProfilesList = props => (
  <List {...props}>
      <Datagrid rowClick="edit">
        <TextField source="first_name" />
        <TextField source="last_name" />
      </Datagrid>
    </List>
);

const ProfilesEdit = props => (
  <Edit {...props}>
      <SimpleForm>
        <TextInput source="first_name" />
        <TextInput source="last_name" />
      </SimpleForm>
  </Edit>
);

const ProfilesCreate = props => (
  <Create {...props}>
      <SimpleForm>
        <TextInput source="first_name" />
        <TextInput source="last_name" />
      </SimpleForm>
  </Create>
);

const Profiles = {
  resourceName: "profiles",
  resource: (
    <Resource
      name="profiles"
      list={ProfilesList}
      edit={ProfilesEdit}
      create={ProfilesCreate}
      options={{ label: "Profiles" }}
    />
  )
};

export default Profiles;
