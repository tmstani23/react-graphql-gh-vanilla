

import React, { Component } from 'react';
import axios from 'axios';

const TITLE = 'React GraphQL GitHub Client';

const ADD_STAR = `
  mutation($repositoryId: ID!) {
    addStar(input:{starrableId: $repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

const GET_ISSUES_OF_REPOSITORY = `
  query ($organization: String!, $repository: String!, $cursor: String) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        id
        name
        url
        stargazers {
          totalCount
        }
        viewerHasStarred
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
//Component to query gh api using path and cursor location
//Cursor is a hashed string representing a location within the repository issues
const getIssuesofRepository = (path, cursor) => {
  //The input path is split at the '/' and each half is saved into separate arrays
  const [organization, repository] = path.split('/');
  //The axios post request to github is passed the query and gql variables
  return axiosGitHubGraphQL.post('', {
    query: GET_ISSUES_OF_REPOSITORY,
    variables: { organization, repository, cursor },
    });
};
//This function returns an object containing the organization and errors data as well as handling issue merging after pagination.
const resolveIssuesQuery = (queryResult, cursor) => state => {
  const {data, errors} = queryResult.data;
  //If there is no cursor(more issue button hasn't been clicked yet) return the organization data.
  if(!cursor) {
    return {
      organization: data.organization,
      errors,
    }
  }
  //Create three variables containing the current state issue data, new issue data(that coming after the cursor), and an array containing both.
  const {edges: oldIssues} = state.organization.repository.issues;
  const {edges: newIssues} = data.organization.repository.issues;
  const updatedIssues = [...oldIssues, ...newIssues];
  //Return a nested object containing the current organization, repo and issue data.
    //The issues edges are where to parse from all issue data and is passed the updated issue range
    //This object is used to update the respective state within the App component.
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
//function that handles making the add star mutation post to the GH api
const addStarToRepository = repositoryId => {
  return axiosGitHubGraphQL.post('', {
    query: ADD_STAR,
    variables: { repositoryId },
  });
};

const resolveAddStarMutation = (mutationResult) => (state) => {
 
  const {
    viewerHasStarred,
  } = this.mutationResult.data.data.addStar.starrable;

  return {
    ...state,
    organization: {
      ...state.organization,
      repository: {
        ...state.organization.repository,
        viewerHasStarred,
      },
    },
  }
}

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
  //Make request to github api and update the App state with the returned data
  onFetchFromGitHub = (path, cursor)=> {
    //Call query method and update organization state with the returned nested data object(organization,repository,issues).
    getIssuesofRepository(path, cursor).then(queryResult => 
      this.setState(resolveIssuesQuery(queryResult, cursor)),  
    );
  };
  //This method takes the current endCursor location from the state and calls the onFetchFromGithub chain.
  onFetchMoreIssues = () => {
    //Cursor location is destructured from the organization state object and passed to the fetch method.
    const {
      endCursor,
    } = this.state.organization.repository.issues.pageInfo;
    
    this.onFetchFromGitHub(this.state.path, endCursor)
  }

  //Method that calls the add star query post to the GH api
  onStarRepository = (repositoryId, viewerHasStarred) => {
    addStarToRepository(repositoryId).then(mutationResult => {
      this.setState(resolveAddStarMutation(mutationResult))
    }
    );
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
          {/* Input field that contains the organization and repository */}
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
        {/* Once data is returned display the Organization component with the returned data. 
          onFetchmoreIssues (cursor location and page info) is passed to the component for use down the chain*/}
        {organization ? (
          <Organization 
            organization={organization} 
            errors={errors} 
            onFetchMoreIssues={this.onFetchMoreIssues} 
            onStarRepository={this.onStarRepository}/>
        ) : (
          <p>No Information Yet...</p>
        )}
      </div>
    );
  }
}

//Component that displays the errors if any or returns
  //the organization name and url.  A repository component is also displayed
  //note: the organization/errors arguments are objects and are destructured giving access to properties when passing into the component
  const Organization = ({
    organization,
    errors,
    onFetchMoreIssues,
    onStarRepository,
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
      <Repository 
        repository={organization.repository} 
        onFetchMoreIssues={onFetchMoreIssues} 
        onStarRepository={onStarRepository} />
    </div>
    );
  }
   
  
  const Licenses = ({repository}) => {
    //Display license info if available in the repository data object
    if (repository.licenseInfo) {
      return (
        <div>
            {/* Display license info and call Issues component */}
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
    onStarRepository,
  }) => (
    <div>
      <button 
        type="button" 
        onClick={() => onStarRepository(repository.id, repository.viewerHasStarred)}>
        {repository.viewerHasStarred ? "Unstar" : "Star"}
      </button>
      <Licenses repository={repository}/>
      <hr />
      {/* If the repository hasNextPage flag is set to true display the 
        fetch more issues button */}
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

export default App;
