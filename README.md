Resource aggregator for react-admin.

It allows you to edit/create/delete multiple resources in the same view.

This is useful if you use a data provider that does one to one mapping between
react-admin resources and backend entities (e.g. tables), like [hasura](https://hasura.io/) does.
You might want to map a single resource to several backend entities for listing,
editing and creating.

This package was tested with `react-admin@2.6.2` and `react-admin@3.1.1`. In theory
any react admin version greater than 2.6.2 should work. It was also tested against
`ra-data-hasura@0.0.2` and `ra-data-json-server@2.6.2`. Any data provider that is
compatible with react-admin 2 / 3 should work, but there is no guarantee. There is
an open issue about running compatibility tests here
https://github.com/dryhten/ra-resource-aggregator/issues/1

Currently sorting after non main resource fields doesn't work. If you need that you
might have to use ReferenceInput and sorting after the right field. There is an open
issue about it https://github.com/dryhten/ra-resource-aggregator/issues/11

## Table of contents

<!-- toc -->

- [Setup](#setup)
- [Basic example](#basic-example)
- [Mappings](#mappings)

<!-- tocstop -->

## Setup

You need react-admin (version 2/3) for this.

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
  options: ...
});

...

<Admin dataProvider={this.resourceAggregator.provideData}>
...
</Admin>

```

You can use the data provider of your choice for `dataProvider`. `paramsPatch`
is an optional prop that can be a function to be applied to params everytime
a new action is run by react-admin (e.g. data type conversions for arrays if
your backend is a PostgreSQL database).

`Resources` is a list of objects that follow a specific format. For example, for
`./Resources/MyAggregatedResource.js`:
```
const MyAggregatedResource = {
  resourceName: 'MyAggregatedResource',
  dataProviderMappings: {
    LIST: {
      resource1: {
        main: true,
        params: oldParams => Object.assign({}, oldParams, { filter: { ... } }),
        fields: ['id', ...],
        key: data => data.id
      },
      resource2: {
        main: false,
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

export default MyAggregatedResource;
```

You can also add the React element to the object, so you can render in the main
react admin app. For example, in ./Resources/MyAggregatedResource.js:
```
const MyAggregatedResource = {
  resourceName: 'MyAggregatedResource',
  dataProviderMappings: { ... },
  resource: (
    <Resource
      name="MyAggregatedResource"
      list={MyAggregatedResourceList}
      edit={MyAggregatedResourceEdit}
      create={MyAggregatedResourceCreate}
      options={{ label: 'My Aggregated Resource' }}
    />
  ),
};

export default MyAggregatedResource;
```

Then in the main app:
```
<Admin dataProvider={this.resourceAggregator.provideData}>
  {Resources.MyAggregatedResource.resource}
  ...
</Admin>
```

The `options` argument is optional and for now only accepts boolean `pageSort`, e.g.
```
this.resourceAggregator = new ResourceAggregator({
  ...
  options: { pageSort: true }
});
```

This will enable page level sorting of records (and not whole records).


## Basic example

(This example is implemented in [examples](https://github.com/dryhten/ra-resource-aggregator/tree/master/examples/example_users_profiles_groups) directory. It's fully functional)

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
const UserProfilesList = props => (
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
```

However, if we want to create an edit view that allows us to change both fields
from users (username, email) and profiles (first_name, last_name) in one page
it wouldn't be possible in a straightforward way with react-admin.

With this package you can do the data mappings and write an edit view like this:
```
const UserProfilesEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="username" />
      <TextInput source="email" />
      <TextInput source="first_name" />
      <TextInput source="last_name" />
    </SimpleForm>
  </Edit>
);
```

**Note:** For some reasone (see https://github.com/dryhten/ra-resource-aggregator/issues/7) if you use react-admin version 3 with a data provider written for react-admin version 3, you might need to add all the sources to the Edit view, even if you don't use it. One approach can be to add the fields as hidden and disabled, for example:
```
const HiddenInput = props => (
  <div style={{display: "none"}}>
    {props.children}
  </div>
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
```

You can have the same flat structure for the List view as well!
```
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
```

To do the data mappings you'd have to write an object like this:
```
dataProviderMappings: {
    LIST: {
      users: {
        main: true,
        params: oldParams => Object.assign({}, oldParams, { filter: { ... } }),
        fields: ['id', 'username', 'email'],
        key: data => data.id
      },
      profiles: {
        main: false,
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
        fields: [
           { name: 'id', alias: 'profiles_id' },
          'first_name',
          'last_name',
          'user_id'
        ],
        key: data => data.user_id
      }
    }
}
```

## Mappings

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
sent to data provider (e.g. filtering). This only works for main tables.

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

#### Accumulate

Sometimes you might have many to many relationship between resources. For example,
if you have a `users` resource and a `groups` resource, one user can be part of
multiple groups and one group can have multiple users. To model this usually you
use another resource/table (e.g. `users_groups`) to map user ids with group ids.
In this case you can use the package in the following way: you add the
`users_groups` resource to EDIT/CREATE/DELETE and add `accumulate: true` as prop
to it. This will accumulate values found in `users_groups` into one field
(instead of just using the first value it finds).

All of this makes more sense if you look at UsersGroups in example.

#### Props

These are for each resource (e.g. `LIST.resource1`). The ones in bold are required.

* List
  * **main**: boolean, marks the main table
  * *params*: function (params), applied to params before sending them to dataProvider, must return new params (only works for main table)
  * **fields**: array of either string or objects of {name: string, alias: string}
    what fields to use from the resource; fields should be unique, if they are not use
    alias to define the resulting unique name after aggregation; id must be present here for main table
  * **key**: function (record, allResources), uniquely identifies one record (e.g. id for main table, foreign key for other tables)
* Edit
  * **main**: same as above
  * *params*: same as above
  * **fields**: same as above
  * **key**: same as above
  * *accumulate*: boolean, specifies if resource represents a many to many relationship
  * *getForeignKey*: function (main table id), only needed when accumulate is true, returns an object that only has the field name of the foreign key with the value of the main table id
* Create
  * **main**: same as above
  * *initData*: function (params.data), applies changes to data before creating new records
  * **fields**: same as above
  * **key**: same as above
  * *accumulate* & *getForeignKey* - same as above
* Delete
  * **main**: same as above
  * **fields**: this is usually an empty array, not really needed but it expects array for now
  * **key**: same as above
  * *getId*: required for non main tables, it's a function(record) that should return the resource id from aggregated data (e.g. including alias)
  * *accumulate*: same as above
