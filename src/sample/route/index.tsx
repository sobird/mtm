/*
 * Router Sample
 *
 * sobird<i@sobird.me> at 2023/05/09 2:36:42 created.
 */

import React from "react";
import { BrowserRouter, Link, Route, Switch, useParams, useRouteMatch } from "react-router-dom";

class RouteSample extends React.Component {
  render(): React.ReactNode {
    return (
      <BrowserRouter>
        <div>
          <h2>Router</h2>
          <nav>
            <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/users">Users</Link> | <Link to="/post/123">Post</Link> | <Link to="/topics">Topics</Link>
          </nav>
          <hr />
          <Switch>
            <Route path="/post/:id" children={<Post />} />
            <Route path="/about"><About/></Route>
            <Route path="/users"><Users/></Route>
            <Route path="/topics"><Topics /></Route>
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

function Post() {
  const { id } = useParams<{id: string | undefined}>();
  return <h3>Post: {id}</h3>;
}

function Topics() {
  const match = useRouteMatch();
  console.log('match', match)
  return (
    <div>
      <h3>topics</h3>
      <ul style={{textAlign: "left"}}>
        <li><Link to={`${match.url}/rendering`}>Rendering with React</Link></li>
        <li>
          <Link to={`${match.url}/components`}>Components</Link>
        </li>
        <li>
          <Link to={`${match.url}/props-v-state`}>Props v. State</Link>
        </li>
      </ul>

      <Route exact path={match.path}>
        <h4>Please select a topic.</h4>
      </Route>

      <Route path={`${match.path}/:topicId`}>
        <Topic />
      </Route>
    </div>
  )
}

function Topic() {
  const { topicId } = useParams<{topicId: string | undefined}>();

  return (
    <div>
      <h3>{topicId}</h3>
    </div>
  );
}

export default RouteSample;
