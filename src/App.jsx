

import React, { Component } from 'react';
import axios from 'axios';

const TITLE = 'React GraphQL GitHub Client';
//Graphql query to the github api
const GET_ISSUES_OF_REPOSITORY = `
  query ($organization: String!, $repository: String!) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        name
        url
        licenseInfo{
          name
          description
          id
        }
        issues(last: 5) {
          edges {
            node {
              id
              title
              url
            }
          }
        }
        pullRequests(last: 5) {
          edges {
            node {
              title
              id
            }
          }
        }
      }
    }
  }
`;
//Component that displays the errors if any or returns
  //the organization name and url.  A repository component is also displayed
const Organization = ({organization, errors}) => {
  if (errors) {
    return (
      <p>
        <strong>Something went wrong:</strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    )
  }
  //console.log(organization.repository)
  return (
  <div>
    <p>
      <strong>Issues from Organization: </strong>
      <a href={organization.url}> {organization.name} </a>
    </p>
    <Repository repository={organization.repository} />
    
  </div>
  );
}
//Displays the repository name and a link to the repository
const Repository = ({repository}) => {
  if (repository.licenseInfo) {
    return (
      <p>
        <strong> Licenses:</strong> 
      <p>{repository.licenseInfo.name}</p> 
    </p>
    )
  }
  return (
  <div> 
    <p>
      <strong> In Repository:</strong>  
      <a href={repository.url} > {repository.name} </a>
    </p>
    {/* each of the first five issues in the repo are mapped as list elements */}
    <ul>
      {repository.issues.edges.map((issue) => (
        <li key={issue.node.id}>  
          {/* links containing the issue title and url are displayed */}
          <a href={issue.node.url}>{issue.node.title}</a>
        </li>
      ))}
    </ul>
    
   
    
  </div>
  )
}
//An axios http request object is created which includes the github api endpoint
        //and the requester's github authorization token
const axiosGitHubGraphQL = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
  Authorization: `bearer ${
    //The token is saved in an env file to avoid publically displaying the token.
    process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN
    }`,
  },
});

const getIssuesofRepository = path => {
  //The input path is split at the '/' and each half is saved into separate arrays
  const [organization, repository] = path.split('/');
  //The axios post request to github is passed the query and gql variables
  return axiosGitHubGraphQL.post('', {
    query: GET_ISSUES_OF_REPOSITORY,
    variables: { organization, repository },
    });
};
//This function returns an object containing the organization and errors data
const resolveIssuesQuery = queryResult => () => ({
  organization: queryResult.data.data.organization,
  errors: queryResult.data.errors,
});
//Main App component which handles rendering, lifecycle and user input.
class App extends Component {
  state = {
    path: 'the-road-to-learn-react/the-road-to-learn-react',
    organization: null,
    errors: null
  };
  //Call the fetch method using the input field as a path
    //once the component mounts.
  componentDidMount() {
    this.onFetchFromGitHub(this.state.path);
  };
  //When jsx input field changes update the path state with current value
  onChange = event => {
    this.setState({ path: event.target.value })
  };
  //When submit button is clicked call on fetchFromgithub component
    //to start the data request change
  onSubmit = event => {
    this.onFetchFromGitHub(this.state.path);
    //prevent default submit button behavior
    event.preventDefault();
  };
  onFetchFromGitHub = path => {

    getIssuesofRepository(path).then(queryResult => 
      this.setState(resolveIssuesQuery(queryResult)),  
    );
  };
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
