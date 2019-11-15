import * as treeify from 'treeify'

type Visitor<T> = (vertex: T, stack: T[], visited: Set<T>) => (void | false)
type Tree = { [key: string]: Tree }
enum VertexType {
    None = 0,
    In = 1,
    Out = 2,
    InOut = 3
}

export class DirectedGraph<T> {
    private edges: Map<T, Set<T>> = new Map()
    private redges: Map<T, Set<T>> = new Map()
    private vertices: Map<T, VertexType> = new Map()

    public addVertex (v: T, vertexType = VertexType.None) {
        const type = this.vertices.get(v) || VertexType.None
        this.vertices.set(v, type | vertexType)
    }

    public addEdge (fr: T, to: T) {
        if (!this.edges.has(fr)) {
            this.edges.set(fr, new Set())
        }
        this.edges.get(fr).add(to)
        if (!this.redges.has(to)) {
            this.redges.set(to, new Set())
        }
        this.redges.get(to).add(fr)

        this.addVertex(to, VertexType.In)
        this.addVertex(fr, VertexType.Out)
    }

    public hasEdge (fr: T, to: T) {
        if (!this.edges.has(fr)) return false
        return this.edges.get(fr).has(to)
    }

    public checkCircular (begin: T) {
        let circularPath

        this.preOrder(begin, (node, path, visited) => {
            if (visited.has(node)) {
                circularPath = [...path, node].reverse().join(' <- ')
            }
        })
        return circularPath
    }

    public getSinglePath (vertex: T) {
        const seen = new Set()
        while (true) {
            if (seen.has(vertex)) {
                seen.add(this.circularString(vertex))
                break
            }
            seen.add(vertex)
            const parents = this.redges.get(vertex)
            if (!parents || !parents.size) break
            vertex = parents.values().next().value
        }
        return [...seen].join(' <- ')
    }

    public getRoots () {
        const roots = []
        for (const [vertex, vertextype] of this.vertices) {
            if ((vertextype & VertexType.In) === 0) {
                roots.push(vertex)
            }
        }
        return roots
    }

    public toTree () {
        const tree: Tree = {}
        const nodes = new Map()
        nodes.set(tree, tree)

        for (const root of this.getRoots()) {
            this.preOrder(root, (vertex, stack) => {
                const parentV = stack[stack.length - 1]
                const parentNode = nodes.get(parentV) || tree
                nodes.set(vertex, parentNode[vertex] = {})
            })
        }
        return tree
    }

    public toString () {
        return treeify.asTree(this.toTree())
    }

    private preOrder (vertex: T, visitor: Visitor<T>, path: T[] = [], visited: Set<T> = new Set()): void {
        visitor(vertex, path, visited)

        if (visited.has(vertex)) return
        else visited.add(vertex)

        path.push(vertex)
        for (const child of this.edges.get(vertex) || []) {
            this.preOrder(child, visitor, path, visited)
        }
        path.pop()
    }

    private circularString (vertex: T) {
        return `[Circular(${vertex})]`
    }
}
