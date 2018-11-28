import React, { Component } from 'react';

//Component that displays the errors if any or returns
//the organization name and url.  A repository component is also displayed
//note: the organization/errors arguments are objects and are destructured giving access to properties when passing into the component
const Organization = ({
organization,
errors,
onFetchMoreIssues,
onStarRepository,
onReactionToIssue,
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
    onStarRepository={onStarRepository}
    onReactionToIssue={onReactionToIssue} />
</div>
);
}

const Licenses = ({repository, onReactionToIssue}) => {
//Display license info if available in the repository data object
if (repository.licenseInfo) {
    return (
    <div>
        {/* Display license info and call Issues component */}
        <strong> Licenses:</strong> 
        <p>{repository.licenseInfo.name}</p>
        <p>{repository.licenseInfo.description}</p>
        <strong>Issues from Organization: </strong>
        <Issues repository = {repository} onReactionToIssue={onReactionToIssue}/>
    </div>
    )
}
if (repository)
return (
    <div>
    <strong>Issues from Organization: </strong>
    <Issues repository = {repository} onReactionToIssue={onReactionToIssue} />
    </div>
    
)
}

//Displays the repository name and a link to the repository
const Repository = ({
repository,
onFetchMoreIssues,
onStarRepository,
onReactionToIssue,
}) => (
<div>
    
    <Licenses repository={repository} onReactionToIssue={onReactionToIssue}/>
    <hr />
    <button 
    type="button" 
    onClick={() => onStarRepository(repository.id, repository.viewerHasStarred)
    }
    >
    {repository.stargazers.totalCount}
    {repository.viewerHasStarred ? "Unstar" : "Star"}
    </button>
    {/* If the repository hasNextPage flag is set to true display the 
    fetch more issues button */}
    {repository.issues.pageInfo.hasNextPage && (
    <button onClick={onFetchMoreIssues}>More</button>
    )}
    
</div>
)

//A component to display the issues within each repository
const Issues = ({repository, onReactionToIssue}) => {
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
            {console.log(issue.node.id)}
            <button onClick={() => onReactionToIssue(issue.node.id)}>
                Add Heart to Issue
            </button> 
            {/* links containing the issue title and url are displayed */}
            <a href={issue.node.url}>{issue.node.title}</a>
            <HasComment comment={issue.node.comments} />
            <CommentItem issue={issue}/>
            <ReactionItem issue={issue}/>
            {/* {console.log(issue.node.comments)} */}
        </li>
        ))}
    </ul> 
    </div>
)
}
const CommentItem = ({issue}) => {
return (
    <ul>
    {/* For each issue map through the first 5 comments */}
    {issue.node.comments.edges.map((comment) => (
        // Display each comment body as a list element
        <li key={comment.node.id}>
        <p>{comment.node.body}</p>
        </li>
        
    ))}
    </ul>
)
}
const ReactionItem = ({issue}) => {
return (
    //Create an unordered list of reaction emoticons for each issue
    <div>
    <ul>
        {issue.node.reactions.edges.map(reaction => (
        <li key={reaction.node.id}>{reaction.node.content}</li>
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

export default Organization;