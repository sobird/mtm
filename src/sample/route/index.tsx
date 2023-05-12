/*
 * Router Sample
 *
 * sobird<i@sobird.me> at 2023/05/09 2:36:42 created.
 */

import React from "react";
import { BrowserRouter, Link, Redirect, Route, Switch, useHistory, useLocation, useParams, useRouteMatch } from "react-router-dom";
import { ProvideAuth, useAuth } from "../hooks/useAuth";

class RouteSample extends React.Component {
  render(): React.ReactNode {
    return (
      <ProvideAuth>
        <BrowserRouter>
          <div>
            <h2>Router</h2>
            <nav>
              <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/users">Users</Link> | <Link to="/post/123">Post</Link> | <Link to="/topics">Topics</Link> | <Link to="/protected">Protected</Link>
            </nav>
            <hr />
            <AuthButton />
            <Switch>
              <Route path="/post/:id" children={<Post />} />
              <Route path="/about"><About /></Route>
              <Route path="/users"><Users /></Route>
              <Route path="/topics"><Topics /></Route>
              <PrivateRoute path="/protected"><Protected /></PrivateRoute>
              <Route path="/login">
                <Login />
              </Route>
              <Route path="/"><Home/></Route>
            </Switch>
            
          </div>
        </BrowserRouter>
      </ProvideAuth>
    );
  }
}

function PrivateRoute({ children, ...rest}) {
  const auth = useAuth();

  return (
    <Route {...rest} render={({location}) => 
      auth.user ? (
        children
      ) : (
        <Redirect to={{
          pathname: "/login",
          state: { from: location }
        }}></Redirect>
      )
    }></Route>
  );
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

function Protected() {
  return <h3>Protected</h3>;
}

function AuthButton() {
  const history = useHistory();
  const auth = useAuth();

  return auth.user ? (
    <p>
      Welcome!{" "}
      <button
        onClick={() => {
          auth.signout(() => history.push("/"));
        }}
      >
        Sign out
      </button>
    </p>
  ) : (
    <p>You are not logged in.</p>
  );
}

function Login() {
  const history = useHistory();
  const location = useLocation();
  const auth = useAuth();

  const { from } = location.state || { from: { pathname: "/" } };
  const login = () => {
    auth.signin(() => {
      history.replace(from);
    });
  };

  return (
    <div>
      <p>You must log in to view the page at {from.pathname}</p>
      <button onClick={login}>Log in</button>
    </div>
  );
}

export default RouteSample;
