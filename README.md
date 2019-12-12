Resource aggregator for react-admin.

This is useful if you use a data provider that does one to one mapping between
react-admin resources and backend entities (e.g. tables), like hasura does.
You might want to map a single resource to several backend entities. This is
where this package is useful, it allows you to use data from multiple entities
in the list/edit/create views.

For example, when listing items from `users` table, you might want to have a
column to show `first_name` and `last_name` from `profiles` table. React-admin
allows you to do this using `ReferenceField`, something like this:
```
<ReferenceField source="profile_id" reference="profiles">
  <TextField source="first_name" />
  <TextField source="last_name" />
</ReferenceField>
```

However, if you want to show `first_name` & `last_name` in the edit view
and be able to change them and update data in `profiles` table when you save,
it's not straightforward to do. With this package, you just need to specify a
javascript object that does the mappings between resource and backend entities.

TODO add example

TODO more explanations on how it works below

Resource objects:
 * resourceName: string
 * resource: React element that return <Resource>
 * dataProviderMappings: object specifying how to aggregate resources

dataProviderMappings: { LIST: {}, EDIT: {}, CREATE: {}, DELETE: {} }

LIST: { resource1: { main: boolean, params: func, columns: list, key: func }, resource2: ... }
  * main resource needs id
  * key function for main table should return id (otherwise custom edit is needed)

EDIT: { resource1: { main: boolean, params: func, columns: list, key: func }, resource2: ... }
CREATE: { resource1: { main: boolean, init: func, columns: list, key: func, getForeignKey: func }, resource2: ... }
DELETE: { resource1: { main: boolean, getId: func, columns: list, key: func }, resource2: ... }

columns should have unique strings, otherwise use `name` & `alias`
