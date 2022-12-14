// Encapsulates DOM information for both the code frame and the node in the graph for a given node.
class Node {
    static ACTIVE = 0;
    static INACTIVE = 1;
    constructor(nodeId) {
        this.nodeId = nodeId;
        // possibly consolidate line highlight information into this class.
        this.lines = [2, 5, 6, 7];
        this.lineIdx = 0;
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
        return this.getGraphNode().find('path.node-fill');
    }

    // Manipulate DOM according to state.
    markGraphNode(state) {
        let stroke = state === Node.ACTIVE ? "green" : "none";
        this.getGraphNodeFill().css({
            stroke
        });
    }

    connect() {
        if (!this.isNull()) {
            const root = this.getFrame().find(".function").next().next()[0];
            // const root = this.getFrame()[0];
            const {
                left: startX,
                top: startY
            } = root.getBoundingClientRect();

            const graphNode = this.getGraphNode().find("text")[0];
            const {
                x: nodeX,
                y: nodeY
            } = graphNode.getBoundingClientRect();

            d3.select("#svg_output").append("line")
                .attr("id", `connector-${this.nodeId}`)
                .attr("class", "connector")
                .attr("x1", startX)
                .attr("y1", startY)
                .attr("x2", nodeX)
                .attr("y2", nodeY);
        }
    }

    remove() {
        this.getFrame().remove();
        if (!this.isNull()) {
            $(`#connector-${this.nodeId}`).remove();
            // toRemove.getFrame().find('.line-highlight').removeClass("suspended")
        }
        this.markGraphNode(this.INACTIVE);
    }

    // Insert code frame for this node.
    createFrame(counter) {
        const elem = $(`<div id="frame-${this.nodeId}-container" class="frame line-numbers"><pre data-line="2" id="frame-${this.nodeId}"><code class="language-python">def dfs(root):
  if not root:
    return

  print(root.value)
  dfs(root.left)
  dfs(root.right)
</code></pre></div>`);

        elem.css({
            left: `${(counter) * 160 + 30}px`,
            top: `${(counter) * 80}px`
        });
        return elem;
    }
}