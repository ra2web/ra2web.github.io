'use strict';

const origAssignRotationValue = SPE.Emitter.prototype._assignRotationValue;
SPE.Emitter.prototype._assignRotationValue = function( index ) {
    if (!this.rotation._angle && !this.rotation._angleSpread) {
        return;
    }

    origAssignRotationValue.call(this, index);
};

const origAssignColorValue = SPE.Emitter.prototype._assignColorValue;
SPE.Emitter.prototype._assignColorValue = function( index ) {
    if (!this.color._spread[0].manhattanLength() && !this.color._spread.some(v => v.x || v.y || v.z) ) {
        let numItems = this.color._value.length,
            colors = [];

        for ( let i = 0; i < numItems; ++i ) {
            colors.push( this.color._value[ i ].getHex() );
        }

        this.attributes.color.typedArray.setVec4Components( index, colors[ 0 ], colors[ 1 ], colors[ 2 ], colors[ 3 ] );
        return;
    }

    origAssignColorValue.call(this, index);
};

const origAssignAbsLifetimeValue = SPE.Emitter.prototype._assignAbsLifetimeValue;
SPE.Emitter.prototype._assignAbsLifetimeValue = function( index, propName ) {
    var prop = this[ propName ],
        utils = SPE.utils;

    if (!prop._spread[0] && utils.arrayValuesAreEqual( prop._spread )) {
        this.attributes[ propName ].typedArray.setVec4Components( index,
            prop._value[ 0 ],
            prop._value[ 1 ],
            prop._value[ 2 ],
            prop._value[ 3 ]
        );
        return;
    }

    origAssignAbsLifetimeValue.call(this, index, propName);
};
