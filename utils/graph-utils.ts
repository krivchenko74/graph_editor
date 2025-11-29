export const printAdjacencyMatrix = (matrix: (number | null)[][]) => {
  console.log("Матрица смежности:");
  matrix.forEach((row) => {
    console.log(row.map((val) => (val === null ? "0" : val)).join(" "));
  });
};

export const getNeighbors = (
  vertexIndex: number,
  matrix: (number | null)[][]
) => {
  const neighbors: number[] = [];
  matrix[vertexIndex].forEach((weight, index) => {
    if (weight !== null) {
      neighbors.push(index);
    }
  });
  return neighbors;
};

export const isConnected = (matrix: (number | null)[][]) => {
  // Проверка связности графа
  const visited = new Array(matrix.length).fill(false);
  const stack = [0];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (!visited[current]) {
      visited[current] = true;
      matrix[current].forEach((weight, index) => {
        if (weight !== null && !visited[index]) {
          stack.push(index);
        }
      });
    }
  }

  return visited.every((v) => v);
};
