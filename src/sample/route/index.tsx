/*
 * Router Sample
 *
 * sobird<i@sobird.me> at 2023/05/09 2:36:42 created.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Prompt, Redirect, Route, Switch, useHistory, useLocation, useParams, useRouteMatch } from "react-router-dom";
import { ProvideAuth, useAuth } from "../hooks/useAuth";
import { useSelector } from "react-redux";
import { IStoreState } from "../../store/reducers";

class RouteSample extends React.Component {
  render(): React.ReactNode {
    return (
      <ProvideAuth>
        <BrowserRouter>
          <div>
            <h2>Router</h2>
            <nav>
              <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/users">Users</Link> | <Link to="/post/123">Post</Link> | <Link to="/topics">Topics</Link> | <Link to="/protected">Protected</Link> | <Link to="/not-match">Not Match</Link>
            </nav>
            <hr />
            <AuthButton />
            <Switch>
              <Route exact path="/"><Home/></Route>
              <Route path="/post/:id" children={<Post />} />
              <Route path="/about"><About /></Route>
              <Route path="/users"><Users /></Route>
              <Route path="/topics"><Topics /></Route>
              <PrivateRoute path="/protected"><Protected /></PrivateRoute>
              <Route path="/login">
                <Login />
              </Route>
              <Route path="*">
                <NoMatch />
              </Route>
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

let lastFn = null;

function Home() {
  const [count, setCount] = useState(0);
  const { user } = useSelector((state: IStoreState) => state.app);

  let homeName = 'Home';
  
  // useEffect(() => {
    
  //   const timer = setInterval(() => {
  //     setCount( c => c + 1);
  //   }, 1000);

  //   return () => {
  //     console.log('home unload');

  //     clearInterval(timer);
  //   }
  // }, [user.name]);

  useMemo(() => {
    console.log('home memo')
    homeName = 'Home Memo'
  }, [user.name]);


  const fn1 = () => {
    console.log('useMemo')
    return <p style={{color: 'red'}}>{count}</p>
  };

  const fn2 = () => {
    console.log('useCallback')
    return <p style={{color: 'red'}}>{count}</p>
  };


  const newCount = useMemo(fn1, [count]);

  const cb = useCallback(fn2, [count])
  

   console.log('lastFn', cb == fn2)

  lastFn = cb;


  const factorial = useCallback((n) => {
    if(n === 0) {
      return 1;
    }

    console.log('n', n);
    const res = factorial(n - 1);
    console.log('res', res);

    return n * res;
  }, []);
  
  return (
    <>
      <h3>{homeName}, {user.name}</h3>
      <p>{count}</p>
      {newCount}
      {cb()}
      {factorial(5)}
    </>
  );
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

      <Prompt
        when={true}
        message={location =>
          `Are you sure you want to go to ${location.pathname}`
        }
      />
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

function NoMatch() {
  const location = useLocation();

  return (
    <div>
      <h3>
        No match for <code>{location.pathname}</code>
      </h3>
    </div>
  );
}

export default RouteSample;
