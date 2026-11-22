import { describe, expect, it } from "vitest";
import { createSseParser } from "./sseParser";

describe("createSseParser", () => {
  it("parses every complete frame of a chunk into typed battle events", () => {
    const parser = createSseParser();

    expect(
      parser.feed(
        'event: text\ndata: {"text":"Turn 1:\\nPikachu attacks"}\n\n' +
          "event: end\ndata: {}\n\n"
      )
    ).toEqual([{ type: "text", text: "Turn 1:\nPikachu attacks" }, { type: "end" }]);
  });

  it("holds a frame split across chunks until it is complete", () => {
    const parser = createSseParser();

    expect(parser.feed('event: text\ndata: {"text":"Pika')).toEqual([]);
    expect(parser.feed('chu"}\n')).toEqual([]);
    expect(parser.feed('\nevent: error\ndata: {"message":"The battle narration failed"}\n\n')).toEqual([
      { type: "text", text: "Pikachu" },
      { type: "error", message: "The battle narration failed" },
    ]);
  });

  it("parses a round result, with whether each move was picked at random", () => {
    const parser = createSseParser();

    expect(
      parser.feed(
        'event: round\ndata: {"round":2,"actions":[{"attacker":1,"move":"tackle","hit":true,"damage":57,"ko":true,"fallback":true}],"hp":[0,25],"winner":1}\n\n'
      )
    ).toEqual([
      {
        type: "round",
        round: 2,
        actions: [{ attacker: 1, move: "tackle", hit: true, damage: 57, ko: true, fallback: true }],
        hp: [0, 25],
        winner: 1,
      },
    ]);
  });

  it("skips a round without a valid result", () => {
    const parser = createSseParser();

    expect(
      parser.feed(
        'event: round\ndata: {"round":1,"actions":[],"hp":[12]}\n\n' +
          'event: round\ndata: {"round":1,"actions":[{"attacker":0,"move":"tackle"}],"hp":[1,2]}\n\n' +
          'event: round\ndata: {"round":1,"actions":[{"attacker":0,"move":"tackle","hit":true,"damage":5,"ko":false}],"hp":[1,2]}\n\n'
      )
    ).toEqual([]);
  });

  it("skips frames that are not battle events", () => {
    const parser = createSseParser();

    expect(parser.feed('event: ping\ndata: {}\n\nevent: text\ndata: {"oops":1}\n\n')).toEqual([]);
  });
});
