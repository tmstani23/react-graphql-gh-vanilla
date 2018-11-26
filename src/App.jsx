

import React, { Component } from 'react';
import axios from 'axios';

const TITLE = 'React GraphQL GitHub Client';

const GET_ISSUES_OF_REPOSITORY = `
  query ($organization: String!, $repository: String!, $cursor: String) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        name
        url
        licenseInfo{
          name
          description
        }
        issues(first: 5, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
              comments(last: 5) {
                edges {
                  node {
                    id
                    body
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;
//Component that displays the errors if any or returns
  //the organization name and url.  A repository component is also displayed
  //note: the organization/errors arguments are objects and are destructured giving access to properties when passing into the component
const Organization = ({
  organization,
  errors,
  onFetchMoreIssues,
}) => {
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
      <strong>Organization: </strong>
      <a href={organization.url}> {organization.name} </a>
    </p>
    <Repository repository={organization.repository} onFetchMoreIssues={onFetchMoreIssues} />
  </div>
  );
}
 

const Licenses = ({repository}) => {
  //Display license info if available in the repository data object
  if (repository.licenseInfo) {
    return (
      <div>
        
          <strong> Licenses:</strong> 
          <p>{repository.licenseInfo.name}</p>
          <p>{repository.licenseInfo.description}</p>
          <strong>Issues from Organization: </strong>
          <Issues repository = {repository} />
      </div>
    )
  }
  if (repository)
  return (
    <div>
      <strong>Issues from Organization: </strong>
      <Issues repository = {repository} />
    </div>
    
  )
}

//Displays the repository name and a link to the repository
const Repository = ({
  repository,
  onFetchMoreIssues,
}) => (
  <div>
    <Licenses repository={repository}/>
    <hr />
    {repository.issues.pageInfo.hasNextPage && (
      <button onClick={onFetchMoreIssues}>More</button>
    )}
    
  </div>
)
//A component to display the issues within each repository
const Issues = ({repository}) => {
  return (
    // A link to the repository is displayed
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
            <HasComment comment={issue.node.comments} />
            <ul>
              {/* For each issue map through the first 5 comments */}
              {issue.node.comments.edges.map((comment) => (
                // Display each comment body as a list element
                <li key={comment.node.id}>
                  <p>{comment.node.body}</p>
                </li>
              ))}
            </ul>
            {/* Create an unordered list of reaction emoticons for each issue */}
            <ul>
              {issue.node.reactions.edges.map(reaction => (
              <li key={reaction.node.id}>{reaction.node.content}</li>
              ))}
            </ul>
            {/* {console.log(issue.node.comments)} */}
          </li>
      ))}
      </ul> 
    </div>
  )
}
//This component checks if there are comments available
const HasComment = ({comment}) => {
  //If there are comments display a comment message
  return !comment.edges.length == 0 
    ? ( <div>
        <strong>Comments:</strong>  
      </div> )
    : null; 
};
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

const getIssuesofRepository = (path, cursor) => {
  //The input path is split at the '/' and each half is saved into separate arrays
  const [organization, repository] = path.split('/');
  //The axios post request to github is passed the query and gql variables
  return axiosGitHubGraphQL.post('', {
    query: GET_ISSUES_OF_REPOSITORY,
    variables: { organization, repository, cursor },
    });
};
//This function returns an object containing the organization and errors data
const resolveIssuesQuery = (queryResult, cursor) => state => {
  const {data, errors} = queryResult.data;
  console.log(queryResult);
  if(!cursor) {
    return {
      organization: data.organization,
      errors,
    }
  }

  const {edges: oldIssues} = state.organization.repository.issues;
  const {edges: newIssues} = data.organization.repository.issues;
  const updatedIssues = [...oldIssues, ...newIssues];

  return {
    organization: {
      ...data.organization,
      repository: {
        ...data.organization.repository,
        issues: {
          ...data.organization.repository.issues,
          edges: updatedIssues,
        },
      },
    },
    errors,
  };
};

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
  onFetchFromGitHub = (path, cursor)=> {

    getIssuesofRepository(path, cursor).then(queryResult => 
      this.setState(resolveIssuesQuery(queryResult, cursor)),  
    );
  };
  onFetchMoreIssues = () => {
    const {
      endCursor,
    } = this.state.organization.repository.issues.pageInfo;

    this.onFetchFromGitHub(this.state.path, endCursor)
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
          <Organization organization={organization} errors={errors} onFetchMoreIssues={this.onFetchMoreIssues} />
        ) : (
          <p>No Information Yet...</p>
        )}
      </div>
    );
  }
}

export default App;
