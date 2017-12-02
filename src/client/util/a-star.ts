class BinaryHeap<T> {
    content: T[];
    scoreFunction: (value: T) => number;

    constructor(scoreFunction: (value: T) => number) {
        this.content = [];
        this.scoreFunction = scoreFunction;
    }

    push(element: T) {
        this.content.push(element);
        this.sinkDown(this.content.length - 1);
    }

    pop(): T {
        const result = this.content[0];
        const end = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = end!;
            this.bubbleUp(0);
        }
        return result;
    }

    remove(node: T) {
        const i = this.content.indexOf(node);
        const end = this.content.pop();

        if (i !== this.content.length - 1) {
            this.content[i] = end!;

            if (this.scoreFunction(end!) < this.scoreFunction(node)) {
                this.sinkDown(i);
            } else {
                this.bubbleUp(i);
            }
        }
    }

    size() {
        return this.content.length;
    }

    rescoreElement(node: T) {
        this.sinkDown(this.content.indexOf(node));
    }

    sinkDown(n: number) {
        const element = this.content[n];

        while (n > 0) {

            const parentN = ((n + 1) >> 1) - 1;
            const parent = this.content[parentN];
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;
                n = parentN;
            } else {
                break;
            }
        }
    }

    bubbleUp(n: number) {
        const length = this.content.length;
        const element = this.content[n];
        const elemScore = this.scoreFunction(element);

        while (true) {
            const child2N = (n + 1) << 1;
            const child1N = child2N - 1;
            let swap = null;
            let child1Score;
            if (child1N < length) {
                const child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);

                if (child1Score < elemScore) {
                    swap = child1N;
                }
            }

            if (child2N < length) {
                const child2 = this.content[child2N];
                const child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)!) {
                    swap = child2N;
                }
            }

            if (swap !== null) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            } else {
                break;
            }
        }
    }
}

type MovementCostFunction<T> = (from: T, to: T) => number;
type HeuristicFunction<T> = (pos: T, goal: T) => number;

interface AStarOptions<T> {
    cost: MovementCostFunction<T>;
    heuristic: HeuristicFunction<T>;
    maxIterations?: number;
    closest?: boolean;
}

interface GraphNode<TPosition> {
    position: TPosition;
    neighborsIndices: ReadonlyArray<TPosition>;
    heuristicCost: number;
    soFarCost: number;
    totalCost: number;
    cameFrom?: GraphNode<TPosition>;
    closed: boolean;
    visited: boolean;
}

interface Graph<TPosition> {
    getNode(index: TPosition): GraphNode<TPosition>;    
    reset(): void;
    markDirty(node: GraphNode<TPosition>): void;
}

function pathTo<TPosition>(node: GraphNode<TPosition> | undefined): TPosition[] {
    let result: TPosition[] = [];
    let iterations = 0;
    do {
        if (iterations++ >= 65000) {
            alert('pathTo: too many!');
            throw new Error('pathTo: too many!');
        }
        result.push(node!.position);
        node = node!.cameFrom;
    } while (node && node.cameFrom);
    return result.reverse();
}

export function aStar<TPosition>(
    graph: Graph<TPosition>,
    startIndex: TPosition, endIndex: TPosition,
    options: AStarOptions<TPosition>
): TPosition[] | undefined {
    options = Object.assign({
        closest: true,
        maxIterations: Infinity
    }, options);

    graph.reset();
    var heuristic = options.heuristic;
    var closest = options.closest || false;
    var start = graph.getNode(startIndex);
    var end = graph.getNode(endIndex);

    var openHeap = new BinaryHeap<GraphNode<TPosition>>(node => node.totalCost);
    var closestNode = start; // set the start node to be the closest if required

    start.heuristicCost = heuristic(start.position, end.position);
    graph.markDirty(start);

    openHeap.push(start);
    let iterations = 0;
    while (openHeap.size() > 0) {
        if (iterations++ >= options.maxIterations!) {
            console.log(`Too many iterations!`, iterations, openHeap.size());
            alert('Too many!');
            throw new Error('too many iterations');
        }
        // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
        var currentNode = openHeap.pop();

        if (!currentNode) {
            throw new Error(`Ran out of nodes!`);
        }

        // End case -- result has been found, return the traced path.
        if (currentNode === end || heuristic(currentNode.position, end.position) < 1) {
            return pathTo(currentNode);
        }

        // Normal case -- move currentNode from open to closed, process each of its neighbors.
        currentNode.closed = true;

        // Find all neighbors for the current node.
        var neighborsIndices = currentNode.neighborsIndices;

        for (var i = 0, il = neighborsIndices.length; i < il; ++i) {
            var neighbor = graph.getNode(neighborsIndices[i]);

            if (neighbor.closed) {
                // Not a valid node to process, skip to next neighbor.
                continue;
            }

            // The g score is the shortest distance from start to current node.
            // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
            var soFarCost = currentNode.soFarCost + options.cost(currentNode.position, neighbor.position);
            var beenVisited = neighbor.visited;

            if (!beenVisited || soFarCost < neighbor.soFarCost) {

                // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                neighbor.visited = true;
                neighbor.cameFrom = currentNode;
                neighbor.heuristicCost = neighbor.heuristicCost || options.heuristic(neighbor.position, end.position);
                neighbor.soFarCost = soFarCost;
                neighbor.totalCost = neighbor.soFarCost + neighbor.heuristicCost;
                graph.markDirty(neighbor);
                if (closest) {
                    // If the neighbour is closer than the current closestNode or if it's equally close but has
                    // a cheaper path than the current closest node then it becomes the closest node
                    if (
                        neighbor.heuristicCost < closestNode.heuristicCost ||
                        (neighbor.heuristicCost === closestNode.heuristicCost && neighbor.soFarCost < closestNode.soFarCost)
                    ) {
                        closestNode = neighbor;
                    }
                }

                if (!beenVisited) {
                    // Pushing to heap will put it in proper place based on the 'f' value.
                    openHeap.push(neighbor);
                } else {
                    // Already seen the node, but since it has been rescored we need to reorder it in the heap
                    openHeap.rescoreElement(neighbor);
                }
            }
        }
    }

    if (closest) {
        return pathTo(closestNode);
    }

    // No result was found - empty array signifies failure to find path.
    return undefined;
}

export class IndexedGraph<TPosition> implements Graph<TPosition> {
    indexedNodes: { [key: string]: GraphNode<TPosition> } = {};
    dirtyNodes: GraphNode<TPosition>[] = [];

    constructor(
        protected hashIndex: (position: TPosition) => string,
        protected getNeighborIndices: (position: TPosition) => ReadonlyArray<TPosition>
    ) {

    }

    getNode(position: TPosition) {
        let hash = this.hashIndex(position);
        if (this.indexedNodes[hash] === undefined) {
            this.indexedNodes[hash] = this.createNode(position);
        }
        return this.indexedNodes[hash];
    }

    createNode(position: TPosition): GraphNode<TPosition> {
        return {
            position: position,
            cameFrom: undefined,
            closed: false,
            visited: false,
            heuristicCost: 0,
            soFarCost: 0,
            totalCost: 0,
            neighborsIndices: this.getNeighborIndices(position)
        };
    }

    markDirty(node: GraphNode<TPosition>) {
        this.dirtyNodes.push(node);
    }

    cleanNode(node: GraphNode<TPosition>) {
        node.cameFrom = undefined;
        node.closed = false;
        node.visited = false;
        node.heuristicCost = 0;
        node.soFarCost = 0;
        node.totalCost = 0;
    }

    reset() {
        for (let node of this.dirtyNodes) {
            this.cleanNode(node);
        }
        this.dirtyNodes.length = 0;
    }

    clear() {
        this.indexedNodes = {};
        this.dirtyNodes.length = 0;
    }
}