import React from "react";

const HiddenInput = props => (
  <div style={{display: "none"}}>
    {props.children}
  </div>
);

export default HiddenInput;
