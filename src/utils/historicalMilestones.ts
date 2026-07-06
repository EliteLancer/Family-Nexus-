/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Milestone {
  year: number;
  title: string;
  description: string;
}

export const HISTORICAL_MILESTONES: Milestone[] = [
  { year: 1914, title: "World War I Begins", description: "Global conflict triggered by the assassination of Archduke Franz Ferdinand." },
  { year: 1918, title: "World War I Ends", description: "Armistice signed, ending hostilities on the Western Front." },
  { year: 1920, title: "Women's Suffrage (US)", description: "The 19th Amendment is ratified, granting women the right to vote." },
  { year: 1927, title: "First Talking Movie", description: "The Jazz Singer is released, starting the era of sound in cinema." },
  { year: 1929, title: "Great Depression Begins", description: "Stock market crash triggers a decade-long worldwide economic depression." },
  { year: 1939, title: "World War II Begins", description: "Invasion of Poland sparks the deadliest conflict in human history." },
  { year: 1945, title: "World War II Ends", description: "Allied forces celebrate victory, and the United Nations is established." },
  { year: 1947, title: "Cold War Begins", description: "Geopolitical tensions lock the US and USSR in a decades-long rivalry." },
  { year: 1953, title: "DNA Double Helix Discovered", description: "Watson and Crick publish the double helix structure of DNA." },
  { year: 1957, title: "Sputnik Satellite Launch", description: "USSR launches the first artificial satellite, initiating the Space Race." },
  { year: 1961, title: "First Human in Space", description: "Yuri Gagarin orbits the Earth aboard Vostok 1." },
  { year: 1963, title: "Kennedy Assassinated", description: "US President John F. Kennedy is assassinated in Dallas, Texas." },
  { year: 1969, title: "Apollo 11 Moon Landing", description: "Neil Armstrong becomes the first human to walk on the moon." },
  { year: 1973, title: "First Mobile Phone Call", description: "Martin Cooper of Motorola makes the first handheld cell phone call." },
  { year: 1977, title: "Personal Computer Revolution", description: "Apple II, Commodore PET, and TRS-80 bring computers to households." },
  { year: 1989, title: "Berlin Wall Falls", description: "Symbolic end of the Iron Curtain and division of Europe." },
  { year: 1991, title: "World Wide Web Launched", description: "Tim Berners-Lee opens the WWW to the public." },
  { year: 1997, title: "Mars Pathfinder Lands", description: "NASA lands rover Sojourner on Mars, sending back colored images." },
  { year: 2001, title: "September 11 Attacks", description: "Terrorist attacks on the US reform global security policies." },
  { year: 2007, title: "First iPhone Released", description: "Apple launches the modern smartphone revolution." },
  { year: 2012, title: "Curiosity Rover Lands", description: "NASA lands rover Curiosity in Gale Crater to explore Mars' history." },
  { year: 2020, title: "COVID-19 Pandemic", description: "Global health crisis triggers worldwide lockdowns and work-from-home shifts." }
];
