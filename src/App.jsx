import React, { Component } from 'react';
import axios from 'axios';
import Organization, {Loading} from './components.jsx';

const TITLE = 'React GraphQL GitHub Client';

//Graph QL mutations used for updating the github api
const ADD_STAR = `
  mutation($repositoryId: ID!) {
    addStar(input:{starrableId: $repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;
const REMOVE_STAR = `
  mutation($repositoryId: ID!) {
    removeStar(input:{starrableId: $repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

const ADD_REACTION = `
mutation($commentId: ID!){
  addReaction(input:{subjectId:$commentId, content:HEART}) {
    reaction {
      content
    }
  }
}
`
const REMOVE_REACTION = `
mutation($commentId: ID!){
  removeReaction(input:{subjectId:$commentId, content:HEART}) {
    reaction {
      content
    }
  }
}
`
//The GQL query used for specifying which data do get from the Github api
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
              
              comments(last: 5) {
                edges {
                  node {
                    id
                    body
                    reactions(first: 5) {
                      edges {
                        node {
                          id
                          content
                        }
                      }
                    }
                    reactionGroups{
                      viewerHasReacted
                    }
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
    })
};

//function that handles making the add star mutation post to the GH api
const addStarToRepository = repositoryId => {
  return axiosGitHubGraphQL.post('', {
    query: ADD_STAR,
    variables: { repositoryId },
  });
};

//function that handles making the add star mutation post to the GH api
const removeStarToRepository = repositoryId => {
  return axiosGitHubGraphQL.post('', {
    query: REMOVE_STAR,
    variables: { repositoryId },
  });
};
//Function that handles adding a reaction to the github api using the comment node id
const addReactionToIssue = commentId => {
  return axiosGitHubGraphQL.post('', {
    query: ADD_REACTION,
    variables: { commentId },
  })
}
//Function that handles adding a reaction to the github api using the comment node id
const removeReactionToIssue = commentId => {
  return axiosGitHubGraphQL.post('', {
    query: REMOVE_REACTION,
    variables: { commentId },
  })
}


const resolveAddStarMutation = mutationResult => state => {
 //Save current viewHasStarred status to a variable
  const {
    viewerHasStarred,
  } = mutationResult.data.data.addStar.starrable;
  //Create totalCount variable containing current # of stargazers
  const { totalCount } = state.organization.repository.stargazers
  
  return {
    ...state,
    organization: {
      ...state.organization,
      repository: {
        ...state.organization.repository,
        viewerHasStarred,
        stargazers: {
          // total count is incremented +1 after starring and updated within the nested object structure
          totalCount: totalCount + 1,
        }
      },
    },
  }
}
const resolveRemoveStarMutation = mutationResult => state => {
  //Save current viewHasStarred status to a variable
   const {
     viewerHasStarred,
   } = mutationResult.data.data.removeStar.starrable;
   //Create totalCount variable containing current # of stargazers
   const { totalCount } = state.organization.repository.stargazers
   
   return {
     ...state,
     organization: {
       ...state.organization,
       repository: {
         ...state.organization.repository,
         viewerHasStarred,
         stargazers: {
           // total count is incremented +1 after starring and updated within the nested object structure
           totalCount: totalCount - 1,
         }
       },
     },
   }
 }

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

//Main App component which handles rendering, lifecycle and user input.
class App extends Component {
  state = {
    path: 'the-road-to-learn-react/the-road-to-learn-react',
    organization: null,
    errors: null,
    loading: true
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
    //to start the data request chain
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
    if(viewerHasStarred) {
      //Call the remove star mutation function then update the state with the result
      removeStarToRepository(repositoryId).then(mutationResult => {
        //resolve function returns an updated state object(organization, repo, issue)
        this.setState(resolveRemoveStarMutation(mutationResult))
      });
    }
    else {
      addStarToRepository(repositoryId).then(mutationResult => {
        this.setState(resolveAddStarMutation(mutationResult))
      });
    }
  }
  //Function called when user clicks on the comment add reaction button
  onReactionToIssue = (commentId, viewerHasReacted) => {
    //If viewer already added a heart
    viewerHasReacted 
    //call remove reaction function chain then once the result is returned, 
    //make a new query request to the api to update the state
      //This is less optimal than creating an updated state object and using it to update state
        //But there was too much nesting for the comment reactions and my brain couldn't handle.
    ? removeReactionToIssue(commentId).then(this.onFetchFromGitHub(this.state.path))
    //Else call add reaction function chain
    : addReactionToIssue(commentId).then(this.onFetchFromGitHub(this.state.path))  
  }

  render() {
    const { path, organization, errors } = this.state;

    return (
      <div className="App">
        <h1>{TITLE}</h1>
        {/* create form element.  on submit method is called when form button is clicked */}
        <form onSubmit={this.onSubmit}>
          <label htmlFor="url">
            Show open issues for https://github.com
          </label>
          {/* Input field that contains the organization and repository */}
          <input
            id="url"
            type="text"
            //Set state path variable to the input's value
            value={path}
            //Update path state as user types into the input
            onChange={this.onChange}
            style={{ width: "300px" }}
          />
          <button type="submit">Search</button>
        </form>

        <hr />
        {/* Once data is returned display the Organization component with the returned data. 
          onFetchmoreIssues (cursor location and page info) is passed to the component for use down the chain
          App methods are passed into child components for use.*/}
        {organization ? (
          <Organization 
            organization={organization} 
            errors={errors} 
            onFetchMoreIssues={this.onFetchMoreIssues} 
            onStarRepository={this.onStarRepository}
            onReactionToIssue={this.onReactionToIssue}/>
        ) : (
          //Loading component displays loading message when waiting for data to return
          <Loading />
        )}
      </div>
    );
  }
}

export default App;