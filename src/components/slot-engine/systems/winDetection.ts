import type { Reel } from '../view/Reel'
import type { SlotConfig } from '../logic/types'

export interface WinningLine {
  index: number
  symbolId: number
  tiles: Array<{ column: number; row: number }>
}

export class WinDetectionSystem {
  private static isWild(symbolId: number, wildSymbolId: number): boolean {
    return symbolId === wildSymbolId
  }

  private static symbolsMatch(symbol1: number, symbol2: number, wildSymbolId: number): boolean {
    return (
      this.isWild(symbol1, wildSymbolId) ||
      this.isWild(symbol2, wildSymbolId) ||
      symbol1 === symbol2
    )
  }

  private static getBaseSymbol(symbols: number[], wildSymbolId: number) {
    for (const symbol of symbols) {
      if (!this.isWild(symbol, wildSymbolId)) {
        return symbol
      }
    }
    return wildSymbolId
  }

  static checkWinningLines(reels: Reel[], config: SlotConfig) {
    const winningLines: WinningLine[] = []
    const { ROWS, COLUMNS, WILD_SYMBOL_ID } = config

    const centerTiles: number[][] = []

    for (let col = 0; col < COLUMNS; col++) {
      const reel = reels[col]
      const centerSymbols = reel.getCenterSymbols(ROWS)
      centerTiles.push(centerSymbols)
    }

    if (import.meta.env.DEV) {
      console.log('Center tiles:', centerTiles)
    }

    const pathSet = new Set<string>()
    let lineIndex = 0

    for (let startRow = 0; startRow < ROWS; startRow++) {
      const paths = this.findAllPaths(centerTiles, 0, startRow, COLUMNS, ROWS, WILD_SYMBOL_ID)

      paths.forEach(path => {
        const pathKey = path.map(({ col, row }) => `${col}-${row}`).join(',')

        if (!pathSet.has(pathKey)) {
          pathSet.add(pathKey)

          const baseSymbol = this.getBaseSymbol(
            path.map(({ col, row }) => centerTiles[col][row]),
            WILD_SYMBOL_ID
          )

          winningLines.push({
            index: lineIndex++,
            symbolId: baseSymbol,
            tiles: path.map(({ col, row }) => ({ column: col, row })),
          })
        }
      })
    }

    if (import.meta.env.DEV) {
      console.log(`Found ${winningLines.length} unique winning paths:`, winningLines)
    }

    return winningLines
  }

  private static findAllPaths(
    centerTiles: number[][],
    currentCol: number,
    currentRow: number,
    totalCols: number,
    totalRows: number,
    wildSymbolId: number,
    baseSymbol: number | null = null,
    pathSoFar: Array<{ col: number; row: number }> = []
  ): Array<Array<{ col: number; row: number }>> {
    const currentSymbol = centerTiles[currentCol][currentRow]

    let pathBaseSymbol = baseSymbol
    if (pathBaseSymbol === null) {
      if (this.isWild(currentSymbol, wildSymbolId)) {
        pathBaseSymbol = null
      } else {
        pathBaseSymbol = currentSymbol
      }
    }

    if (pathBaseSymbol !== null) {
      if (!this.symbolsMatch(pathBaseSymbol, currentSymbol, wildSymbolId)) {
        return []
      }
    } else {
      if (!this.isWild(currentSymbol, wildSymbolId)) {
        pathBaseSymbol = currentSymbol
      }
    }

    const newPath = [...pathSoFar, { col: currentCol, row: currentRow }]

    if (currentCol === totalCols - 1) {
      if (pathBaseSymbol === null) {
        pathBaseSymbol = wildSymbolId
      }
      const isValid = newPath.every(({ col, row }) =>
        this.symbolsMatch(pathBaseSymbol!, centerTiles[col][row], wildSymbolId)
      )
      return isValid ? [newPath] : []
    }

    const nextCol = currentCol + 1
    const possibleNextRows: number[] = []

    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      const nextRow = currentRow + rowOffset
      if (nextRow >= 0 && nextRow < totalRows) {
        possibleNextRows.push(nextRow)
      }
    }

    const allPaths: Array<Array<{ col: number; row: number }>> = []

    for (const nextRow of possibleNextRows) {
      const nextSymbol = centerTiles[nextCol][nextRow]

      let nextBaseSymbol = pathBaseSymbol
      if (nextBaseSymbol === null) {
        if (!this.isWild(nextSymbol, wildSymbolId)) {
          nextBaseSymbol = nextSymbol
        }
      }

      const canContinue =
        nextBaseSymbol === null || this.symbolsMatch(nextBaseSymbol, nextSymbol, wildSymbolId)

      if (canContinue) {
        const subPaths = this.findAllPaths(
          centerTiles,
          nextCol,
          nextRow,
          totalCols,
          totalRows,
          wildSymbolId,
          nextBaseSymbol,
          newPath
        )

        allPaths.push(...subPaths)
      }
    }

    return allPaths
  }
}
