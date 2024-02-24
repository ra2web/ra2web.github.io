const tmpVec3 = new THREE.Vector3();

/**
 * A special scenegraph object to implement octree division for its children.
 * This works for quadtrees and binary trees as well, just set the boundary box
 * coordinates `-Infinity` and `Infinity`  for the dimension(s) you want to
 * ignore.
 *
 * @class Octree
 * @constructor
 * @extends THREE.Object3D
 *
 * @author Monty Thibault
**/
function Octree(box, config) {
    THREE.Object3D.call(this);

    this.isOctree = true;

    this.divided = false;
    this.box = box || new THREE.Box3();

    this.config = config || {};
    this.config.maxDepth = this.config.maxDepth || 5;
    this.config.splitThreshold = this.config.splitThreshold || 10;
    this.config.joinThreshold =  this.config.joinThreshold || 5;
    // Skips matrixWorld updates for invisible octants
    this.config.skipInvisMatrixUpdate = !!this.config.skipInvisMatrixUpdate;

    // This object is not really positioned in the world, so skip matrix operations
    this.matrixAutoUpdate = false;
}

Octree.prototype = Object.create(THREE.Object3D.prototype);
Octree.prototype.constructor = Octree;

Octree.prototype.add = function(...objects) {
    for (let obj of objects) {
        this.addDeep(obj, true);
    }
    return this;
}

/**
 * Emulates the standard `object.add` API found in THREE.js. Automatically sorts
 * the object into the appropriate region of the tree.
 *
 * @returns true on success, false if the object is not within bounds
**/
Octree.prototype.addDeep = function(object, update) {
    if(this.box.containsPoint(object.position)) {
        if(this.divided) {
            var region;
            for(var i = 0; i < this.children.length; i++) {
                region = this.children[i];

                if(region.addDeep(object, update)) {
                    return true;
                }
            }
        } else {
            THREE.Object3D.prototype.add.call(this, object);
            (update !== false) && this.update();
            return true;
        }
    }

    return false;
};

Octree.prototype.remove = function(...objects) {
    for (let obj of objects) {
        this.removeDeep(obj, true);
    }
    return this;
}

/**
 * Emulates the standard `object.remove` API found in THREE.js.
 **/
Octree.prototype.removeDeep = function(object, update) {
    if(object.parent !== this) {
        if (object.parent.isOctree) {
            object.parent.removeDeep(object, update);
        } else {
            object.parent.remove(object);
        }
        return;
    }

    THREE.Object3D.prototype.remove.call(this, object);
    if(this.parent.isOctree) {
        (update !== false) && this.parent.update();
    }
};

/**
 * Returns the region that the given point belongs to, without adding it as an
 * object
**/
Octree.prototype.point = function(vec) {
    if(this.box.containsPoint(vec)) {
        if(this.divided) {
            var region;
            for(var i = 0; i < this.children.length; i++) {
                region = this.children[i].point(vec);
                if(region) {
                    return region;
                }
            }
        } else {
            return this;
        }
    }

    return false;
};

/**
 * Splits this object into several smaller regions and sorts children
 * appropriately. This only performs the operation 1 level deep.
**/
Octree.prototype.split = function() {
    if(this.divided || (this.config.maxDepth <= 1)) return false;

    var config = {
        joinThreshold: this.config.joinThreshold,
        splitThreshold: this.config.splitThreshold,
        maxDepth: this.config.maxDepth - 1,
        skipInvisMatrixUpdate: this.config.skipInvisMatrixUpdate
    };

    var regions = this.generateRegions(),
        objects = this.children;

    this.children = [];
    for(var i = 0; i < regions.length; i++) {
        THREE.Object3D.prototype.add.call(this, new Octree(regions[i], config));
    }

    this.divided = true;
    for(i = 0; i < objects.length; i++) {
        objects[i].parent = null;
        this.addDeep(objects[i], false);
    }

    return true;
};

/**
 * Merges child regions back into this one.
**/
Octree.prototype.join = function() {
    if(!this.divided) return false;

    var newChildren = [];
    for(var i = 0; i < this.children.length; i++) {
        this.children[i].join();
        // We'll remove this octant below, but we don't want to iterate again
        this.children[i].parent = void 0;
        newChildren = newChildren.concat(this.children[i].children);
    }

    for (var j = 0; j < newChildren.length; j++) {
        newChildren[j].parent = this;
    }

    this.children = newChildren;
    this.divided = false;
};

/**
 * Determines the new bounding boxes when this will be split. (8 octants if
 * using an octree and 4 quadrants if using a quadtree)
**/
Octree.prototype.generateRegions = function() {
    var regions = [this.box.clone()],
        center = this.box.getCenter(tmpVec3),
        i, l, boxA, boxB;

    if(isFinite(this.box.max.x)) {
        boxA = regions[0];
        boxB = boxA.clone();

        boxA.max.x = center.x;
        boxB.min.x = center.x;

        // The first box is already part of the array
        regions.push(boxB);
    }

    if(isFinite(this.box.max.y)) {
        for(i = 0, l = regions.length; i < l; i++) {
            boxA = regions[i];
            boxB = boxA.clone();

            boxA.max.y = center.y;
            boxB.min.y = center.y;

            regions.push(boxB);
        }
    }

    if(isFinite(this.box.max.z)) {
        for(i = 0, l = regions.length; i < l; i++) {
            boxA = regions[i];
            boxB = boxA.clone();

            boxA.max.z = center.z;
            boxB.min.z = center.z;

            regions.push(boxB);
        }
    }

    return regions;
};
/**
 * Splits or joins the tree if there are too many/few children in this region.
**/
Octree.prototype.update = function() {
    var totalChildren = 0;

    if(this.divided) {
        for(var i = 0; i < this.children.length; i++) {
            totalChildren += this.children[i].update();
        }

        if(totalChildren <= this.config.joinThreshold) {
            this.join();
        }
    } else {
        totalChildren = this.children.length;

        if(totalChildren >= this.config.splitThreshold) {
            if(this.split()) {
                // If it split successfully, see if we can do it again
                this.update();
            }
        }
    }

    return totalChildren;
};

/**
 * Sorts object into the correct region. This should be called on objects that
 * may have moved out of their regions since the last update. Since it will be
 * called frequently, this method does not update the octree structure.
**/
Octree.prototype.updateObject = function(object) {
    // If object is no longer inside this region
    if(!object.parent.box.containsPoint(object.position)) {
        var parent = object.parent;
        if (object.parent.isOctree) {
            object.parent.removeDeep(object, false);
        } else {
            object.parent.remove(object);
        }

        // Loop through parent regions until the object is added successfully
        var oct = parent.parent;

        while(oct.isOctree) {
            if(oct.addDeep(object, false)) {
                break;
            }
            oct = oct.parent;
        }
    }
};

Octree.prototype.updateMatrixWorld = function(force) {
    if (!this.visible && this.config.skipInvisMatrixUpdate) {
        return;
    }
    THREE.Object3D.prototype.updateMatrixWorld.call(this, force);
}

/**
 * Generates a wireframe object to visualize the tree.
**/
Octree.prototype.generateGeometry = function() {
    var container = new THREE.Object3D();
    var material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true
    });

    this.traverse(function(object) {
        if(object.isOctree) {
            var size = object.box.getSize(),
                center = object.box.getCenter(tmpVec3);

            var geo = new THREE.CubeGeometry(
                isFinite(size.x) ? size.x : 0,
                isFinite(size.y) ? size.y : 0,
                isFinite(size.z) ? size.z : 0,
                1, 1, 1);

            var mesh = new THREE.Mesh(geo, material);
            mesh.position.set(
                isFinite(center.x) ? center.x : 0,
                isFinite(center.y) ? center.y : 0,
                isFinite(center.z) ? center.z : 0);

            container.add(mesh);
        }
    });

    return container;
};
