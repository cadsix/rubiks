declare module 'cubejs' {
  class Cube {
    constructor();
    static initSolver(): void;
    static fromString(faceletStr: string): Cube;
    solve(): string;
    move(alg: string): void;
    asString(): string;
    clone(): Cube;
    isSolved(): boolean;
  }
  export default Cube;
  export = Cube;
}
