### Spotify OAuth 2.0 Tokens Simplified ###
##### _Easily bundle an Access Token request with StepZen's @sequence directive_ #####

_(Editor's Note: In his last post, freelance developer Joey Anuff showed how easy it is to combine  Spotify and Google data using StepZen's @materializer directive. We welcome him back to explain how StepZen's @sequence directive simplifies adding OAuth authorization to a request.)_

When I used StepZen to sync the Spotify and Knowledge Graph APIs, I quickly encountered a common headache with mixed APIs: their diversity of authorization requirements. Specifically, requests to Google's Knowledge Graph require an API key that never expires, while requests to Spotify require an access token that expires after just an hour.

Hand-cranking a temporary token using the Spotify web dashboard was good enough for a quick demo, but given the simplicity of our OAuth request–which involves no user authentication, only application authentication–we were left with a perfect case study to illustrate StepZen's handling of the most basic of OAuth code flows: the Client Credentials Flow.

StepZen's @sequence directive, our tool for this task, is complementary to their @materializer directive–the former for extending query definitions, the latter for extending type definitions–and can be seen as different means to the same end: ordering your API calls.

Where @materializer allows us to step through our API requests implicitly, just by descending through our type fields and filling out the dependent data, @sequence lets us step through API requests explicitly–and is located in a query definition, a better home for transitory permissions data whose particulars are incidental to our main data types.

Here's how we @sequence in a call to Spotify's Auth endpoint in just three steps, a simplified version of Sam Hill's [recent Auth 2.0 walkthrough](https://stepzen.com/blog/sequence-oauth).


**1. Add Spotify Auth type and query:**

Spotify's authorization endpoint behaves the same as the HubSpot server in Sam's example, but our grant type of client_credentials returns an even simpler JSON response, of which access_token is the only field we'll be preserving. 

<p align="center">
  <img src="././images/spotifytoken.png"/>
</p>

###### As always, we test our API endpoints in Postman first. ######

Translating this exchange into StepZen-enhanced GraphQL is as simple as defining a Spotify_Auth type and an @rest-powered query to return it, like so:


```
type Spotify_Auth {
  access_token: String!
}

type Query {
  get_auth: Spotify_Auth
    @rest(
      method: POST
      contenttype: "application/x-www-form-urlencoded"
      endpoint: "https://accounts.spotify.com/api/token?grant_type=client_credentials&client_id=$client_id&client_secret=$client_secret"
      configuration: "spotify_config"
    )
}
```

**2. Add an authorization step to a @sequence-driven query**

In a @sequence of steps, all fields returned from a prior step are automatically supplied as parameters to the next query, but prior fields or initial arguments need to be included, as with the initial q parameter in the spotify_Search step below.

```
type Query {
  spotify_search_with_token(
    q: String!
  ): Spotify_Track
    @sequence(
      steps: [
        { query: "get_auth" }
        { query: "spotify_Search"
          arguments: [
            { name: "q", argument: "q" }
          ]
        }        
      ]
    )
}
```

**3. Add token as required argument to Search query:**

Finally, we add access_token as a required argument to spotify_Search query–instead of passing in the hand-coded value from our config, as I did in my first pass. It's still available as $access_token, but now it's a dynamic value.

```
type Query {
  """
  Get Spotify Catalog information about artists that match a keyword string.
  """
  spotify_Search(
    """
    Query keywords and optional filters and operators. E.g., `jazz pop`
    """
    q: String
    limit: Int = 1
    access_token: String!
  ): [Spotify_Track]
    @rest(
      endpoint: "https://api.spotify.com/v1/search?q=$q&type=track"
      headers: [{ name: "Authorization", value: "Bearer $access_token" }]

      (...)
  ```

  Now we can explore our data at our leisure, with no more fear of token-timeout errors.

  <p align="center">
  <img src="././images/spotifywithtoken.png"/>
</p>
