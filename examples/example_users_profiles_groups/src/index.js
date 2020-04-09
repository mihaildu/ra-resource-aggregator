import React from "react";
import ReactDOM from "react-dom";
import { Admin, Resource } from "react-admin";
import jsonServerProvider from "ra-data-json-server";
import ResourceAggregator from 'ra-resource-aggregator';

import * as Resources from "./Resources";

const jsonDataProvider = jsonServerProvider("http://localhost:3000");


const resourceAggregator = new ResourceAggregator({
  dataProvider: jsonDataProvider,
  resources: Resources
});

const dataProvider = async (type, resource, params) => {
  return resourceAggregator.provideData(type, resource, params);
};

const App = () => (
  <Admin dataProvider={dataProvider}>
    {Resources.UserProfiles.resource}
    {Resources.Users.resource}
    {Resources.Profiles.resource}
    {Resources.UsersGroups.resource}
    <Resource name="groups" />
  </Admin>
);

ReactDOM.render(
    <App />,
    document.getElementById("root")
);
