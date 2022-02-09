import { Form, useLoaderData, useSearchParams } from "remix";
import { useState } from "react";
import type { MetaFunction, LinksFunction, LoaderFunction } from "remix";
import searchUrl from "../styles/search-input.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: searchUrl }];
};

export const meta: MetaFunction = () => {
  return {
    title: "Remix && StepZen",
    description: "Knowledge-annotated Spotify data"
  };
};

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("search") ?? "Beatles Norwegian Wood";
  console.log("query from loader", query);
  return getStepzen(query);
};

export async function getStepzen(query: string){
  console.log("process.env.STEPZEN_ENDPOINT", process.env.STEPZEN_ENDPOINT);
  let res = await fetch(`${process.env.STEPZEN_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `${process.env.STEPZEN_API_KEY}`
    },
    body: JSON.stringify({
      query: `
        query MyQuery($query: String!) {
          spotify_Search_With_Token(q: $query) {
            id
            album
            albumInfo {
              name
              description
              detailedDescription {
                articleBody
              }
            }
            artistsInfo {
              description
              name
              detailedDescription {
                articleBody
              }
            }
            track
            trackInfo {
              description
              detailedDescription {
                articleBody
              }
              name
            }
            artists
          }
        }`,
      variables: {
        query: query,
      },
    }),
  })
  console.log("res", res)
  return res.json();
}

export default function Index() {
  // const data  = useLoaderData();
  // console.log('all data from loader', data)
  const { spotify_Search_With_Token: song } = useLoaderData().data;
  // console.log('song from component', song)
  const [search, setSearch] = useState(useSearchParams()[0].get("search") ?? "");

  return (
    <div className="remix-stepzen">
      <nav>
      <img src="../../favicon.ico"/><h3>Remix, <img src="../../graphql.svg"/>GraphQL, and <img src="../../stepzen.svg"/>StepZen</h3>
      </nav>
      <Form method="get" className="search-form">
        <input
          defaultValue={search}
          placeholder="Band & Song..."
          autoComplete="off"
          name="search"
          type="search"
        />
        <button type="submit">
          Spotify + Knowledge
        </button>
      </Form>
      <main>
        { song ? (
          <div className="song-info">
            <h4>{song.track}</h4>
            <h5>{song.trackInfo[0]?.detailedDescription?.articleBody || song.trackInfo[0]?.description || ""}</h5>
            <h4>{song.artists ? song.artists : ""}</h4>
            <h5>{song.artistsInfo[0]?.detailedDescription?.articleBody || song.artistsInfo[0]?.description || ""}</h5>
            <h4>{song.album ? song.album: ""}</h4>
            <h5>{song.albumInfo[0]?.detailedDescription?.articleBody || song.albumInfo[0]?.description || ""}</h5>
          </div>
          ) : <h4>No Results</h4> 
        }
      </main>
    </div>
  );
}