// Encapsulates DOM information for both the code frame and the node in the graph for a given node.
const lineConstructor = d3.line().x(d => d[0]).y(d => d[1]);
class Node {
    static ACTIVE = 0;
    static INACTIVE = 1;
    static VISITED = 2;
    static LEFT = "L";
    static RIGHT = "R";
    static DELETE = "delete";
    constructor(nodeId) {
        this.nodeId = nodeId;
        this.lineIdx = 0; // Each frame already starts at line #2.
        if (typeof nodeId === "string") {
            this.lines = [1, 2, 3];
        } else {
            this.lines = [1, 2, 5, 6, 7];
        }
    }

    getCurrentLineNumber() {
        return this.lines[this.lineIdx];
    }

    advance() {
        this.lineIdx++;
    }

    restoreCounter() {
        this.lineIdx = this.lines.length - 1;
    }

    retreat() {
        this.lineIdx--;
        this.lineIdx--;
    }

    valid() {
        return !this.isNull();
    }

    id() {
        return this.nodeId;
    }

    toString() {
        return this.nodeId + '';
    }

    // seems kind a hack?
    isNull() {
        return typeof this.nodeId === "string";
    }

    // DOM selectors for this node.
    getFrame() {
        return $(`#frame-${this.nodeId}-container`);
    }

    getGraphNode() {
        return $(`.node > title:contains(${this.nodeId})`).parent();
    }

    getGraphNodeFill() {
        return this.getGraphNode().find('path');
    }

    getConnector() {
        return $(`#connector-${this.nodeId}`);
    }

    getNull() {
        return $(`text#${this.nodeId}`);
    }

    // Manipulate DOM according to state.
    activate() {
        const frame = this.getFrame();
        this.markGraphNode(Node.ACTIVE);
        this.getConnector().addClass('active');
        frame.removeClass("inactive");
        frame.addClass("active");
        frame.find('.line-highlight').removeClass('inactive suspended');
    }

    deactivate() {
        const frame = this.getFrame();
        frame.addClass('inactive');
        frame.removeClass('active');
        frame.find('.line-highlight').addClass('inactive');
        this.getConnector().removeClass('active');
        this.markGraphNode(Node.INACTIVE);
    }

    markGraphNode(state) {
        const node = this.getGraphNodeFill();

        if (state === Node.ACTIVE) {
            if (this.isNull()) {
                const n = this.getNull();
                n.removeClass("visited");
                n.addClass("active");
            } else {
                node.addClass("active");
                node.removeClass("visited");
                // THIS IS A HACK: assumes that the text label node is always the first node in the HTML.
                this.getGraphNode().find("text").first().removeClass("visited");
            }
        } else if (state === Node.INACTIVE) {
            node.removeClass("active");
        } else if (state === Node.VISITED) {
            if (this.isNull()) {
                const n = this.getNull();
                n.addClass("visited");
                n.removeClass("active");
            } else {
                node.removeClass("active");
                node.addClass("visited");
                this.getGraphNode().find('text').addClass("visited");
            }
        } else {
            // reset the node to its original state
            if (this.isNull()) {
                const n = this.getNull();
                n.removeClass("visited");
                n.removeClass("active");
            } else {
                this.getGraphNode().find("text").first().removeClass("visited");
                node.removeClass("visited");
                node.removeClass("active");
            }
        }
    }

    connect(activate) {
        // TODO: change this to the per-animation container
        const parent = $('.animation-container');
        const {
            top: parentTop,
            left: parentLeft,
        } = parent.offset();

        const root = this.getFrame().find(".root-cell");
        // const root = this.getFrame()[0];
        let {
            left: elemLeft,
            top: elemTop,
        } = root.offset();

        // Make this a percentage of the total width / height of the connector.
        let startX = elemLeft - parentLeft;
        const height = root.height();
        const top = elemTop - parentTop;

        let startY = top + height / 2;

        const graphNode = this.valid() ? this.getGraphNode().find("text") : this.getNull();
        let {
            left: nodeX,
            top: nodeY
        } = graphNode.offset();

        nodeX = nodeX - parentLeft;
        nodeY = nodeY - parentTop;

        const X_BUFFER = 10;
        const Y_BUFFER = 10;

        startX = startX + X_BUFFER;
        startY = startY + 5;
        nodeY += Y_BUFFER;
        nodeX = nodeX - X_BUFFER;

        const midX = startX + (nodeX - startX) / 2;
        const points = [
            [startX, startY],
            [midX, startY],
            [midX, nodeY],
            [nodeX, nodeY]
        ]

        const c = activate ? "connector active" : 'connector';
        const g = d3.select("#svg_output").append("g").attr("class", c).attr("id", `connector-${this.nodeId}`);

        g.append("path")
            .attr("class", "connector")
            .datum(points)
            .attr("d", lineConstructor)

        g
            .append("circle")
            .attr("cx", startX)
            .attr("cy", startY)
            .attr("r", 4)
            .attr("fill", "white")

    }

    // completely removes this frame from the DOM
    // Different than deactivate, is called when another node is placed on top of this frame.
    destroy() {
        const frame = this.getFrame();
        frame.addClass(Node.DELETE);
        $(`#connector-${this.nodeId}`).remove();
        this.markGraphNode(Node.VISITED);
        // frame.remove();
    }

    // reset all the state about this node.
    resetState() {
        const frame = this.getFrame();
        $(`#connector-${this.nodeId}`).remove();
        frame.remove();
        this.markGraphNode();
    }

    // Insert code frame for this node.
    createFrame(counter) {
        const elem = $(`<div id="frame-${this.nodeId}-container" class="flex active frame line-numbers"><pre data-line=${this.getCurrentLineNumber()} id="frame-${this.nodeId}"><code class="language-python">def dfs(node):
  if not node:
    return

  print(node.value)
  dfs(node.left)
  dfs(node.right)
</code>
</pre>
<div class="variables">
    <table class="variable-grid">
        <tr class="first-row">
            <td class="first-cell">node</td>
            <td class="root-cell"></td>
        </tr>
    </table>
</div>
</div>`);

        // TODO: remove the hard-coding of 150 and 80 and make them relative to width of the viewport.
        elem.css({
            left: `${(counter) * 150 + 30}px`,
            top: `${(counter) * 80 + 30}px`
        });
        this.advance(); // lineIdx always points to the NEXT line of code to be executed.


        return elem;
    }
}