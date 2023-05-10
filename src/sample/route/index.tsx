/*
 * Router Sample
 *
 * sobird<i@sobird.me> at 2023/05/09 2:36:42 created.
 */

import React from "react";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";

class RouteSample extends React.Component {
  render(): React.ReactNode {
    return (
      <BrowserRouter>
        <div>
          <h2>Router</h2>
          <nav>
            <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/users">Users</Link>
          </nav>

          <Switch>
            <Route path="/about"><About/></Route>
            <Route path="/users"><Users/></Route>
            <Route path="/"><Home/></Route>
          </Switch>
          
        </div>
      </BrowserRouter>
    );
  }
}

function Home() {
  return <h3>Home</h3>;
}

function About() {
  return <h3>About</h3>;
}

function Users() {
  return <h3>Users</h3>;
}

export default RouteSample;
