import fetch, { Response } from "node-fetch";
import { map, mergeMap,  } from "rxjs/operators";
import { get } from "./utils";
import { forkJoin, of } from "rxjs";

/* 
Read data from https://swapi.dev/api/people/1 (Luke Skywalker)
and dependent data from swapi to return the following object

{
    name: 'Luke Skywalker',
    height: 172,
    gender: 'male',
    homeworld: 'Tatooine',
    films: [
        {
            title: 'A New Hope',
            director: 'George Lucas',
            release_date: '1977-05-25'
        },
        ... // and all other films
    ]
}

Define an interface of the result type above and all other types as well.

*/

interface Film {
  title: string;
  director: string;
  release_date: string;
}

interface Planet {
  name: string;
}

interface Person {
  name: string;
  height: string;
  gender: "male" | "female" | "divers";
  homeworld: string;
  films: string[];
}

export interface PersonInfo {
  name: string;
  height: number;
  gender: "male" | "female" | "divers";
  homeworld: string;
  films: Film[];
}

// Task 1: Write a function using promise-based fetch API
type PromiseBasedFunction = () => Promise<PersonInfo>;
export const getLukeSkywalkerInfo: PromiseBasedFunction = () => {
  return fetch("https://swapi.dev/api/people/1")
    .then((response: Response) => response.json())
    .then(async (person: Person) => {
      const homeworldResponse = await fetch(person.homeworld);
      const homeworld = await homeworldResponse.json();

      const filmPromises = person.films.map((filmUrl) =>
        fetch(filmUrl).then((filmResponse) => filmResponse.json())
      );
      const films = await Promise.all(filmPromises);

      return {
        name: person.name,
        height: parseInt(person.height, 10),
        gender: person.gender,
        homeworld: homeworld.name,
        films: films.map((film: Film) => ({
          title: film.title,
          director: film.director,
          release_date: film.release_date,
        })),
      };
    });
};

// Task 2: Write a function using async and await
type AsyncBasedFunction = () => Promise<PersonInfo>;
export const getLukeSkywalkerInfoAsync: AsyncBasedFunction = async () => {
  const response = await fetch("https://swapi.dev/api/people/1");
  const person: Person = await response.json();

  const homeworldResponse = await fetch(person.homeworld);
  const homeworld: Planet = await homeworldResponse.json();

  const films = await Promise.all(
    person.films.map(async (filmUrl) => {
      const filmResponse = await fetch(filmUrl);
      return filmResponse.json();
    })
  );

  return {
    name: person.name,
    height: parseInt(person.height, 10),
    gender: person.gender,
    homeworld: homeworld.name,
    films: films.map((film: Film) => ({
      title: film.title,
      director: film.director,
      release_date: film.release_date,
    })),
  };
};

// Task 3: Write a function using Observable-based API
export const getLukeSkywalkerInfoObservable = () => {
  return get<Person>("https://swapi.dev/api/people/1").pipe(
    mergeMap((person: Person) =>
      forkJoin({
        homeworld: get<Planet>(person.homeworld),
        films: forkJoin(person.films.map((filmUrl) => get<Film>(filmUrl))),
      }).pipe(
        map(({ homeworld, films }) => ({
          name: person.name,
          height: parseInt(person.height, 10),
          gender: person.gender,
          homeworld: homeworld.name,
          films: films.map((film) => ({
            title: film.title,
            director: film.director,
            release_date: film.release_date,
          })),
        }))
      )
    )
  );
};
