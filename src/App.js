

import React, { Component } from 'react';
import axios from 'axios';

const TITLE = 'React GraphQL GitHub Client';
const GET_ORGANIZATION = `
  {
    organization(login: "the-road-to-learn-react") {
      name
      url
    }
  }
`;

const axiosGitHubGraphQL = axios.create({
    baseURL: 'https://api.github.com/graphql',
    headers: {
    Authorization: `bearer ${
    process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN
    }`,
  },
});

const Organization = ({organization, errors}) => {
  if (errors) {
    return (
      <p>
        <strong>Something went wrong:</strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    )
  }
  
  return (
  <div>
    <p>
      <strong>Issues from Organization: </strong>
      <a href={organization.url}> {organization.name} </a>
    </p>
  </div>
  );
}

class App extends Component {
  state = {
    path: 'the-road-to-learn-react/the-road-to-learn-react',
    organization: null,
    errors: null
  };

  componentDidMount() {
    //fetch data
    
    this.onFetchFromGitHub();
  };
  onChange = event => {
    this.setState({ path: event.target.value })
  };
  onSubmit = event => {
    //fetch data

    event.preventDefault();
  };
  onFetchFromGitHub = () => {
    //console.log(process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN);
    axiosGitHubGraphQL
      .post('', { query: GET_ORGANIZATION})
      .then(result => this.setState( () => ({
        organization: result.data.data.organization,
        errors: result.data.errors,
        })),
      )
  }
  render() {
    const { path, organization, errors } = this.state;

    return (
      <div className="App">
        <h1>{TITLE}</h1>

        <form onSubmit={this.onSubmit}>
          <label htmlFor="url">
            Show open issues for https://github.com
          </label>
          <input
            id="url"
            type="text"
            value={path}
            onChange={this.onChange}
            style={{ width: "300px" }}
          />
          <button type="submit">Search</button>
        </form>

        <hr />
        {organization ? (
          <Organization organization={organization} errors = {errors} />
        ) : (
          <p>No Information Yet...</p>
        )}
      </div>
    );
  }
}

export default App;
