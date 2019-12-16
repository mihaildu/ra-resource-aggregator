import React from "react";
import ReactDOM from "react-dom";
import { Admin, Resource } from "react-admin";
import jsonServerProvider from "ra-data-json-server";
import ResourceAggregator from 'ra-resource-aggregator';

import * as Resources from './Resources';


const dataProvider = jsonServerProvider("http://localhost:3000");

const resourceAggregator = new ResourceAggregator({
  dataProvider,
  resources: Resources
});

const App = () => (
  <Admin dataProvider={resourceAggregator.provideData}>
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
