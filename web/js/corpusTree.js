class corpusTreeNode {
    constructor(pos) {
        this.position = pos;
        this.message = "";
        this.metadata = null;
        this.state = -1;
        this.children = new Array(0);
    }
    access_child(idx) {
        if (!this.children.hasOwnProperty(idx))
            this.children[idx] = new corpusTreeNode(this.position + '.' + idx);
        return this.children[idx];
    }
    add_child(name, url) {
        let idx = this._nextNum();
        this.children[idx] = new corpusTreeNode(this.position + '.' + idx.toString());
        this.children[idx].set_metadata(name, url);
        this.children[idx].set_state(1);
        return this.children[idx];
    }
    clean_tree() {
        if (this.state > 1) {
            this.message = "";
            this.metadata = null;
            this.state = -1;
        }
        for (let idx in this.children)
            this.children[idx].clean_tree();
    }
    get_info() {
        return { pos: this.position, name: this.metadata.name, url: this.metadata.url, state: this.state, msg: this.message };
    }
    set_message(msg) {
        this.message = msg;
    }
    set_metadata(name, url) {
        this.metadata = { name: name, url: url }
    }
    set_state(state) {
        this.state = state;
    }
    toArray() {
        let tmp = [];
        if ((this.metadata !== null) && (this.state !== -1))
            tmp.push(this.get_info());
        for (let idx in this.children)
            tmp = tmp.concat(this.children[idx].toArray());
        return tmp;
    }
    _nextNum() {
        return (this.children.length === 0) ? 1 : this.children.length;
    }
}
class corpusTreeRoot extends corpusTreeNode {
    constructor(lst) {
        super("");
        if (lst !== null) {
            for (let idx in lst) {
                if (!lst.hasOwnProperty(idx))
                    continue;
                let node = this.access_child_with_full_position(lst[idx].position);
                node.set_metadata(lst[idx].name, lst[idx].url);
                node.set_state(0);
            }
        }
    }
    access_child(idx) {
        if (!this.children.hasOwnProperty(idx))
            this.children[idx] = new corpusTreeNode(idx);
        return this.children[idx];
    }
    access_child_with_full_position(pos) {
        return pos.split('.').reduce(function(acc, cur) { return acc.access_child(cur); }, this);
    }
    add_child(name, url) {
        let idx = this._nextNum();
        this.children[idx] = new corpusTreeNode(idx.toString());
        this.children[idx].set_metadata(name, url);
        this.children[idx].set_state(1);
        return this.children[idx];
    }
    toArray() {
        let tmp = [];
        for (let idx in this.children)
            tmp = tmp.concat(this.children[idx].toArray());
        return tmp;
    }
}