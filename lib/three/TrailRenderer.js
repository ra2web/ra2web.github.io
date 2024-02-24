/**
* @author Mark Kellogg - http://www.github.com/mkkellogg
*/

//=======================================
// Trail Renderer
//=======================================

THREE.TrailRenderer = function( scene, orientToMovement ) {

	THREE.Object3D.call( this );

	this.active = false;

	this.orientToMovement = false;
	if ( orientToMovement ) this.orientToMovement = true;

	this.scene = scene;

	this.geometry = null;
	this.mesh = null;
	this.nodeCenters = null;

	this.lastNodeCenter = null;
	this.currentNodeCenter = null;
	this.lastOrientationDir = null;
	this.nodeIDs = null;
	this.currentLength = 0;
	this.currentEnd = 0;
	this.currentNodeID = 0;

}

THREE.TrailRenderer.prototype = Object.create( THREE.Object3D.prototype );
THREE.TrailRenderer.prototype.constructor = THREE.TrailRenderer;

THREE.TrailRenderer.MaxHeadVertices = 128;
THREE.TrailRenderer.LocalOrientationTangent = new THREE.Vector3( 1, 0, 0 );
THREE.TrailRenderer.LocalOrientationDirection = new THREE.Vector3( 0, 0, -1 );
THREE.TrailRenderer.LocalHeadOrigin = new THREE.Vector3( 0, 0, 0 );
THREE.TrailRenderer.PositionComponentCount = 3;
THREE.TrailRenderer.UVComponentCount = 2;
THREE.TrailRenderer.IndicesPerFace = 3;
THREE.TrailRenderer.FacesPerQuad = 2;


THREE.TrailRenderer.Shader = {};

THREE.TrailRenderer.Shader.BaseVertexVars = [

	"attribute float nodeID;",
	"attribute float nodeVertexID;",
	"attribute vec3 nodeCenter;",

	"uniform float minID;",
	"uniform float maxID;",
	"uniform float trailLength;",
	"uniform float maxTrailLength;",
	"uniform float verticesPerNode;",
	"uniform vec2 textureTileFactor;",

	"uniform vec4 headColor;",
	"uniform vec4 tailColor;",

	"varying vec4 vColor;",

].join( "\n" );

THREE.TrailRenderer.Shader.TexturedVertexVars = [

	THREE.TrailRenderer.Shader.BaseVertexVars,
	"varying vec2 vUV;",
	"uniform float dragTexture;",

].join( "\n" );

THREE.TrailRenderer.Shader.BaseFragmentVars = [

	"varying vec4 vColor;",
	"uniform sampler2D texture;",

].join( "\n" );

THREE.TrailRenderer.Shader.TexturedFragmentVars = [

	THREE.TrailRenderer.Shader.BaseFragmentVars,
	"varying vec2 vUV;"

].join( "\n" );


THREE.TrailRenderer.Shader.VertexShaderCore = [

	"float fraction = ( maxID - nodeID ) / ( maxID - minID );",
	"vColor = ( 1.0 - fraction ) * headColor + fraction * tailColor;",
	"vec4 realPosition = vec4( ( 1.0 - fraction ) * position.xyz + fraction * nodeCenter.xyz, 1.0 ); ",

].join( "\n" );

THREE.TrailRenderer.Shader.BaseVertexShader = [

	THREE.TrailRenderer.Shader.BaseVertexVars,

	"void main() { ",

		THREE.TrailRenderer.Shader.VertexShaderCore,
		"gl_Position = projectionMatrix * viewMatrix * realPosition;",

	"}"

].join( "\n" );

THREE.TrailRenderer.Shader.BaseFragmentShader = [

	THREE.TrailRenderer.Shader.BaseFragmentVars,

	"void main() { ",

		"gl_FragColor = vColor;",

	"}"

].join( "\n" );

THREE.TrailRenderer.Shader.TexturedVertexShader = [

	THREE.TrailRenderer.Shader.TexturedVertexVars,

	"void main() { ",

		THREE.TrailRenderer.Shader.VertexShaderCore,
		"float s = 0.0;",
		"float t = 0.0;",
		"if ( dragTexture == 1.0 ) { ",
		"   s = fraction *  textureTileFactor.s; ",
		" 	t = ( nodeVertexID / verticesPerNode ) * textureTileFactor.t;",
		"} else { ",
		"	s = nodeID / maxTrailLength * textureTileFactor.s;",
		" 	t = ( nodeVertexID / verticesPerNode ) * textureTileFactor.t;",
		"}",
		"vUV = vec2( s, t ); ",
		"gl_Position = projectionMatrix * viewMatrix * realPosition;",

	"}"

].join( "\n" );

THREE.TrailRenderer.Shader.TexturedFragmentShader = [

	THREE.TrailRenderer.Shader.TexturedFragmentVars,

	"void main() { ",

	    "vec4 textureColor = texture2D( texture, vUV );",
		"gl_FragColor = vColor * textureColor;",

	"}"

].join( "\n" );

THREE.TrailRenderer.createMaterial = function( vertexShader, fragmentShader, customUniforms ) {

	customUniforms = customUniforms || {};

	customUniforms.trailLength = { type: "f", value: null };
	customUniforms.verticesPerNode = { type: "f", value: null };
	customUniforms.minID = { type: "f", value: null };
	customUniforms.maxID = { type: "f", value: null };
	customUniforms.dragTexture = { type: "f", value: null };
	customUniforms.maxTrailLength = { type: "f", value: null };
	customUniforms.textureTileFactor = { type: "v2", value: null };

	customUniforms.headColor = { type: "v4", value: new THREE.Vector4() };
	customUniforms.tailColor = { type: "v4", value: new THREE.Vector4() };

	vertexShader = vertexShader || THREE.TrailRenderer.Shader.BaseVertexShader;
	fragmentShader = fragmentShader || THREE.TrailRenderer.Shader.BaseFragmentShader;

	return new THREE.ShaderMaterial(
	{
		uniforms: customUniforms,
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,

		transparent: true,
		alphaTest: 0.5,

		blending : THREE.CustomBlending,
		blendSrc : THREE.SrcAlphaFactor,
		blendDst : THREE.OneMinusSrcAlphaFactor,
		blendEquation : THREE.AddEquation,

		depthTest: true,
		depthWrite: false,

		side: THREE.DoubleSide
	} );

}

THREE.TrailRenderer.createBaseMaterial = function( customUniforms ) {

	return this.createMaterial( THREE.TrailRenderer.Shader.BaseVertexShader, THREE.TrailRenderer.Shader.BaseFragmentShader, customUniforms );

}

THREE.TrailRenderer.createTexturedMaterial = function( customUniforms ) {

	customUniforms = {};
	customUniforms.texture = { type: "t", value: null };

	return this.createMaterial( THREE.TrailRenderer.Shader.TexturedVertexShader, THREE.TrailRenderer.Shader.TexturedFragmentShader, customUniforms );

}

THREE.TrailRenderer.prototype.initialize = function( material, length, dragTexture, localHeadWidth, localHeadGeometry, targetObject ) {

		this.deactivate();
		this.destroyMesh();

		this.length = ( length > 0 ) ? length + 1 : 0;
		this.dragTexture = ( ! dragTexture ) ? 0 : 1;
		this.targetObject = targetObject;

		this.initializeLocalHeadGeometry( localHeadWidth, localHeadGeometry );

		this.nodeIDs = [];
		this.nodeCenters = [];

		for (var i = 0; i < this.length; i ++ ) {

			this.nodeIDs[ i ] = -1;
			this.nodeCenters[ i ] = new THREE.Vector3();

		}

		this.material = material;

		this.initializeGeometry();
		this.initializeMesh();

		this.material.uniforms.trailLength.value = 0;
		this.material.uniforms.minID.value = 0;
		this.material.uniforms.maxID.value = 0;
		this.material.uniforms.dragTexture.value = this.dragTexture;
		this.material.uniforms.maxTrailLength.value = this.length;
		this.material.uniforms.verticesPerNode.value = this.VerticesPerNode;
		this.material.uniforms.textureTileFactor.value = new THREE.Vector2( 1.0, 1.0 );

		this.reset();

}

THREE.TrailRenderer.prototype.initializeLocalHeadGeometry = function( localHeadWidth, localHeadGeometry ) {

	this.localHeadGeometry = [];

	if ( ! localHeadGeometry ) {

		var halfWidth = localHeadWidth || 1.0;
		halfWidth = halfWidth / 2.0;

		this.localHeadGeometry.push( new THREE.Vector3( -halfWidth, 0, 0 ) );
		this.localHeadGeometry.push( new THREE.Vector3( halfWidth, 0, 0 ) );

		this.VerticesPerNode = 2;

	} else {

		this.VerticesPerNode = 0;
		for ( var i = 0; i < localHeadGeometry.length && i < THREE.TrailRenderer.MaxHeadVertices; i ++ ) {

			var vertex = localHeadGeometry[ i ];

			if ( vertex && vertex instanceof THREE.Vector3 ) {

				var vertexCopy = new THREE.Vector3();

				vertexCopy.copy( vertex );

				this.localHeadGeometry.push( vertexCopy );
				this.VerticesPerNode ++;

			}

		}

	}

	this.FacesPerNode = ( this.VerticesPerNode - 1 ) * 2;
	this.FaceIndicesPerNode = this.FacesPerNode * 3;

}

THREE.TrailRenderer.prototype.initializeGeometry = function() {

	this.vertexCount = this.length * this.VerticesPerNode;
	this.faceCount = this.length * this.FacesPerNode;

	var geometry = new THREE.BufferGeometry();

	var nodeIDs = new Float32Array( this.vertexCount );
	var nodeVertexIDs = new Float32Array( this.vertexCount * this.VerticesPerNode );
	var positions = new Float32Array( this.vertexCount * THREE.TrailRenderer.PositionComponentCount );
	var nodeCenters = new Float32Array( this.vertexCount * THREE.TrailRenderer.PositionComponentCount );
	var uvs = new Float32Array( this.vertexCount * THREE.TrailRenderer.UVComponentCount );
	var indices = new Uint32Array( this.faceCount * THREE.TrailRenderer.IndicesPerFace );

	var nodeIDAttribute = new THREE.BufferAttribute( nodeIDs, 1 );
	nodeIDAttribute.setDynamic( true );
	geometry.addAttribute( 'nodeID', nodeIDAttribute );

	var nodeVertexIDAttribute = new THREE.BufferAttribute( nodeVertexIDs, 1 );
	nodeVertexIDAttribute.setDynamic( true );
	geometry.addAttribute( 'nodeVertexID', nodeVertexIDAttribute );

	var nodeCenterAttribute = new THREE.BufferAttribute( nodeCenters, THREE.TrailRenderer.PositionComponentCount );
	nodeCenterAttribute.setDynamic( true );
	geometry.addAttribute( 'nodeCenter', nodeCenterAttribute );

	var positionAttribute = new THREE.BufferAttribute( positions, THREE.TrailRenderer.PositionComponentCount );
	positionAttribute.setDynamic( true );
	geometry.addAttribute( 'position', positionAttribute );

	var uvAttribute = new THREE.BufferAttribute( uvs, THREE.TrailRenderer.UVComponentCount );
	uvAttribute.setDynamic( true );
	geometry.addAttribute( 'uv', uvAttribute );

	var indexAttribute = new THREE.BufferAttribute( indices, 1 );
	indexAttribute.setDynamic( true );
	geometry.setIndex( indexAttribute );

	this.geometry = geometry;

}

THREE.TrailRenderer.prototype.zeroVertices = function( ) {

	var positions = this.geometry.getAttribute( 'position' );

	for ( var i = 0; i < this.vertexCount; i ++ ) {

		var index = i * 3;

		positions.array[ index ] = 0;
		positions.array[ index + 1 ] = 0;
		positions.array[ index + 2 ] = 0;

	}

	positions.needsUpdate = true;
	positions.updateRange.count = - 1;

}

THREE.TrailRenderer.prototype.zeroIndices = function( ) {

	var indices = this.geometry.getIndex();

	for ( var i = 0; i < this.faceCount; i ++ ) {

		var index = i * 3;

		indices.array[ index ] = 0;
		indices.array[ index + 1 ] = 0;
		indices.array[ index + 2 ] = 0;

	}

	indices.needsUpdate = true;
	indices.updateRange.count = - 1;

}

THREE.TrailRenderer.prototype.formInitialFaces = function() {

	this.zeroIndices();

	var indices = this.geometry.getIndex();

	for ( var i = 0; i < this.length - 1; i ++ ) {

		this.connectNodes( i, i + 1 );

	}

	indices.needsUpdate = true;
	indices.updateRange.count = - 1;

}

THREE.TrailRenderer.prototype.initializeMesh = function() {

	this.mesh = new THREE.Mesh( this.geometry, this.material );
	this.mesh.dynamic = true;
	this.mesh.matrixAutoUpdate = false;

}

THREE.TrailRenderer.prototype.destroyMesh = function() {

	if ( this.mesh ) {

		this.scene.remove( this.mesh );
		this.mesh = null;

	}

}

THREE.TrailRenderer.prototype.reset = function() {

	this.currentLength = 0;
	this.currentEnd = -1;

	this.lastNodeCenter = null;
	this.currentNodeCenter = null;
	this.lastOrientationDir = null;

	this.currentNodeID = 0;

	this.formInitialFaces();
	this.zeroVertices();

	this.geometry.setDrawRange( 0, 0 );

}

THREE.TrailRenderer.prototype.updateUniforms = function() {

	if ( this.currentLength < this.length ) {

		this.material.uniforms.minID.value = 0;

	} else {

		this.material.uniforms.minID.value = this.currentNodeID - this.length;

	}
	this.material.uniforms.maxID.value = this.currentNodeID;
	this.material.uniforms.trailLength.value = this.currentLength;
	this.material.uniforms.maxTrailLength.value = this.length;
	this.material.uniforms.verticesPerNode.value = this.VerticesPerNode;

}

THREE.TrailRenderer.prototype.advance = function() {

	var orientationTangent = new THREE.Vector3();
	var position = new THREE.Vector3();
	var offset = new THREE.Vector3();
	var tempMatrix4 = new THREE.Matrix4();

	return function advance() {

		this.targetObject.updateMatrixWorld();
		tempMatrix4.copy( this.targetObject.matrixWorld );

		this.advanceWithTransform( tempMatrix4 );

		this.updateUniforms();
	}

}();

THREE.TrailRenderer.prototype.advanceWithPositionAndOrientation = function( nextPosition, orientationTangent ) {

	this.advanceGeometry( { position : nextPosition, tangent : orientationTangent }, null );

}

THREE.TrailRenderer.prototype.advanceWithTransform = function( transformMatrix ) {

	this.advanceGeometry( null, transformMatrix );

}

THREE.TrailRenderer.prototype.advanceGeometry = function() {

	var direction = new THREE.Vector3();
	var tempPosition = new THREE.Vector3();

	return function advanceGeometry( positionAndOrientation, transformMatrix ) {

		var nextIndex = this.currentEnd + 1 >= this.length ? 0 : this.currentEnd + 1;

		if( transformMatrix ) {

			this.updateNodePositionsFromTransformMatrix( nextIndex, transformMatrix );

		} else {

			this.updateNodePositionsFromOrientationTangent( nextIndex, positionAndOrientation.position, positionAndOrientation.tangent );
		}

		if ( this.currentLength >= 1 ) {

			var connectRange = this.connectNodes( this.currentEnd , nextIndex );
			var disconnectRange = null;

			if( this.currentLength >= this.length ) {

				var disconnectIndex  = this.currentEnd + 1  >= this.length ? 0 : this.currentEnd + 1;
				disconnectRange = this.disconnectNodes( disconnectIndex );

			}

		}

		if( this.currentLength < this.length ) {

			this.currentLength ++;

		}

		this.currentEnd ++;
		if ( this.currentEnd >= this.length ) {

			this.currentEnd = 0;

		}

		if ( this.currentLength >= 1 ) {

			if( this.currentLength < this.length ) {

				this.geometry.setDrawRange( 0, ( this.currentLength - 1 ) * this.FaceIndicesPerNode);

			} else {

				this.geometry.setDrawRange( 0, this.currentLength * this.FaceIndicesPerNode);

			}

		}

		this.updateNodeID( this.currentEnd,  this.currentNodeID );
		this.currentNodeID ++;
	}

}();

THREE.TrailRenderer.prototype.updateHead = function() {

	var tempMatrix4 = new THREE.Matrix4();

	return function advance() {

		if( this.currentEnd < 0 ) return;

		this.targetObject.updateMatrixWorld();
		tempMatrix4.copy( this.targetObject.matrixWorld );

		this.updateNodePositionsFromTransformMatrix( this.currentEnd, tempMatrix4 );
	}

}();

THREE.TrailRenderer.prototype.updateNodeID = function( nodeIndex, id ) {

	this.nodeIDs[ nodeIndex ] = id;

	var nodeIDs = this.geometry.getAttribute( 'nodeID' );
	var nodeVertexIDs = this.geometry.getAttribute( 'nodeVertexID' );

	for ( var i = 0; i < this.VerticesPerNode; i ++ ) {

		var baseIndex = nodeIndex * this.VerticesPerNode + i ;
		nodeIDs.array[ baseIndex ] = id;
		nodeVertexIDs.array[ baseIndex ] = i;

	}

	nodeIDs.needsUpdate = true;
	nodeVertexIDs.needsUpdate = true;

	nodeIDs.updateRange.offset = nodeIndex * this.VerticesPerNode;
	nodeIDs.updateRange.count = this.VerticesPerNode;

	nodeVertexIDs.updateRange.offset = nodeIndex * this.VerticesPerNode;
	nodeVertexIDs.updateRange.count = this.VerticesPerNode;

}

THREE.TrailRenderer.prototype.updateNodeCenter = function( nodeIndex, nodeCenter ) {

	this.lastNodeCenter = this.currentNodeCenter;

	this.currentNodeCenter = this.nodeCenters[ nodeIndex ];
	this.currentNodeCenter.copy( nodeCenter );

	var nodeCenters = this.geometry.getAttribute( 'nodeCenter' );

	for ( var i = 0; i < this.VerticesPerNode; i ++ ) {

		var baseIndex = ( nodeIndex * this.VerticesPerNode + i ) * 3;
		nodeCenters.array[ baseIndex ] = nodeCenter.x;
		nodeCenters.array[ baseIndex + 1 ] = nodeCenter.y;
		nodeCenters.array[ baseIndex + 2 ] = nodeCenter.z;

	}

	nodeCenters.needsUpdate = true;

	nodeCenters.updateRange.offset = nodeIndex * this.VerticesPerNode * THREE.TrailRenderer.PositionComponentCount;
	nodeCenters.updateRange.count = this.VerticesPerNode * THREE.TrailRenderer.PositionComponentCount;

}

THREE.TrailRenderer.prototype.updateNodePositionsFromOrientationTangent = function() {

	var tempMatrix4 = new THREE.Matrix4();
	var tempQuaternion = new THREE.Quaternion();
	var tempOffset = new THREE.Vector3();
	var tempLocalHeadGeometry = [];

	for ( var i = 0; i < THREE.TrailRenderer.MaxHeadVertices; i ++ ) {

		var vertex = new THREE.Vector3();
		tempLocalHeadGeometry.push( vertex );

	}

	return function updateNodePositionsFromOrientationTangent( nodeIndex, nodeCenter, orientationTangent  ) {

		var positions = this.geometry.getAttribute( 'position' );

		this.updateNodeCenter( nodeIndex, nodeCenter );

		tempOffset.copy( nodeCenter );
		tempOffset.sub( THREE.TrailRenderer.LocalHeadOrigin );
		tempQuaternion.setFromUnitVectors( THREE.TrailRenderer.LocalOrientationTangent, orientationTangent );

		for ( var i = 0; i < this.localHeadGeometry.length; i ++ ) {

			var vertex = tempLocalHeadGeometry[ i ];
			vertex.copy( this.localHeadGeometry[ i ] );
			vertex.applyQuaternion( tempQuaternion );
			vertex.add( tempOffset );
		}

		for ( var i = 0; i <  this.localHeadGeometry.length; i ++ ) {

			var positionIndex = ( ( this.VerticesPerNode * nodeIndex ) + i ) * THREE.TrailRenderer.PositionComponentCount;
			var transformedHeadVertex = tempLocalHeadGeometry[ i ];

			positions.array[ positionIndex ] = transformedHeadVertex.x;
			positions.array[ positionIndex + 1 ] = transformedHeadVertex.y;
			positions.array[ positionIndex + 2 ] = transformedHeadVertex.z;

		}

		positions.needsUpdate = true;

	}

}();

THREE.TrailRenderer.prototype.updateNodePositionsFromTransformMatrix = function() {

	var tempMatrix4 = new THREE.Matrix4();
	var tempMatrix3 = new THREE.Matrix3();
	var tempQuaternion = new THREE.Quaternion();
	var tempPosition = new THREE.Vector3();
	var tempOffset = new THREE.Vector3();
	var worldOrientation = new THREE.Vector3();
	var tempDirection = new THREE.Vector3();

	var tempLocalHeadGeometry = [];
	for ( var i = 0; i < THREE.TrailRenderer.MaxHeadVertices; i ++ ) {

		var vertex = new THREE.Vector3();
		tempLocalHeadGeometry.push( vertex );

	}

	function getMatrix3FromMatrix4( matrix3, matrix4) {

		var e = matrix4.elements;
		matrix3.set( e[0], e[1], e[2],
					 e[4], e[5], e[6],
					 e[8], e[9], e[10] );

	}

	return function updateNodePositionsFromTransformMatrix( nodeIndex, transformMatrix ) {

		var positions = this.geometry.getAttribute( 'position' );

		tempPosition.set( 0, 0, 0 );
		tempPosition.applyMatrix4( transformMatrix );
		this.updateNodeCenter( nodeIndex, tempPosition );

		for ( var i = 0; i < this.localHeadGeometry.length; i ++ ) {

			var vertex = tempLocalHeadGeometry[ i ];
			vertex.copy( this.localHeadGeometry[ i ] );

		}

		for ( var i = 0; i < this.localHeadGeometry.length; i ++ ) {

			var vertex = tempLocalHeadGeometry[ i ];
			vertex.applyMatrix4( transformMatrix );

		}

		if( this.lastNodeCenter && this.orientToMovement ) {

			getMatrix3FromMatrix4( tempMatrix3, transformMatrix );
			worldOrientation.set( 0, 0, -1 );
			worldOrientation.applyMatrix3( tempMatrix3 );

			tempDirection.copy( this.currentNodeCenter );
			tempDirection.sub( this.lastNodeCenter );
			tempDirection.normalize();

			if( tempDirection.lengthSq() <= .0001 && this.lastOrientationDir ) {

				tempDirection.copy( this.lastOrientationDir );
			}

			if( tempDirection.lengthSq() > .0001 ) {

				if( ! this.lastOrientationDir ) this.lastOrientationDir = new THREE.Vector3();

				tempQuaternion.setFromUnitVectors( worldOrientation, tempDirection );

				tempOffset.copy( this.currentNodeCenter );

				for ( var i = 0; i < this.localHeadGeometry.length; i ++ ) {

					var vertex = tempLocalHeadGeometry[ i ];
					vertex.sub( tempOffset );
					vertex.applyQuaternion( tempQuaternion );
					vertex.add( tempOffset );

				}
			}

		}

		for ( var i = 0; i < this.localHeadGeometry.length; i ++ ) {

			var positionIndex = ( ( this.VerticesPerNode * nodeIndex ) + i ) * THREE.TrailRenderer.PositionComponentCount;
			var transformedHeadVertex = tempLocalHeadGeometry[ i ];

			positions.array[ positionIndex ] = transformedHeadVertex.x;
			positions.array[ positionIndex + 1 ] = transformedHeadVertex.y;
			positions.array[ positionIndex + 2 ] = transformedHeadVertex.z;

		}

		positions.needsUpdate = true;

		positions.updateRange.offset = nodeIndex * this.VerticesPerNode * THREE.TrailRenderer.PositionComponentCount;
		positions.updateRange.count = this.VerticesPerNode * THREE.TrailRenderer.PositionComponentCount;
	}

}();

THREE.TrailRenderer.prototype.connectNodes = function() {

	var returnObj = {

			"attribute" : null,
			"offset" : 0,
			"count" : - 1

		};

	return function connectNodes( srcNodeIndex, destNodeIndex ) {

		var indices = this.geometry.getIndex();

		for ( var i = 0; i < this.localHeadGeometry.length - 1; i ++ ) {

			var srcVertexIndex = ( this.VerticesPerNode * srcNodeIndex ) + i;
			var destVertexIndex = ( this.VerticesPerNode * destNodeIndex ) + i;

			var faceIndex = ( ( srcNodeIndex * this.FacesPerNode ) + ( i * THREE.TrailRenderer.FacesPerQuad  ) ) * THREE.TrailRenderer.IndicesPerFace;

			indices.array[ faceIndex ] = srcVertexIndex;
			indices.array[ faceIndex + 1 ] = destVertexIndex;
			indices.array[ faceIndex + 2 ] = srcVertexIndex + 1;

			indices.array[ faceIndex + 3 ] = destVertexIndex;
			indices.array[ faceIndex + 4 ] = destVertexIndex + 1;
			indices.array[ faceIndex + 5 ] = srcVertexIndex + 1;

		}

		indices.needsUpdate = true;
		indices.updateRange.count = - 1;

		returnObj.attribute = indices;
		returnObj.offset =  srcNodeIndex * this.FacesPerNode * THREE.TrailRenderer.IndicesPerFace;
		returnObj.count = this.FacesPerNode * THREE.TrailRenderer.IndicesPerFace;

		return returnObj;

	}
}();

THREE.TrailRenderer.prototype.disconnectNodes = function( srcNodeIndex ) {

	var returnObj = {

			"attribute" : null,
			"offset" : 0,
			"count" : - 1

		};

	return function disconnectNodes( srcNodeIndex ) {

		var indices = this.geometry.getIndex();

		for ( var i = 0; i < this.localHeadGeometry.length - 1; i ++ ) {

			var srcVertexIndex = ( this.VerticesPerNode * srcNodeIndex ) + i;

			var faceIndex = ( ( srcNodeIndex * this.FacesPerNode ) + ( i * THREE.TrailRenderer.FacesPerQuad ) ) * THREE.TrailRenderer.IndicesPerFace;

			indices.array[ faceIndex ] = 0;
			indices.array[ faceIndex + 1 ] = 0;
			indices.array[ faceIndex + 2 ] = 0;

			indices.array[ faceIndex + 3 ] = 0;
			indices.array[ faceIndex + 4 ] = 0;
			indices.array[ faceIndex + 5 ] = 0;

		}

		indices.needsUpdate = true;
		indices.updateRange.count = - 1;

		returnObj.attribute = indices;
		returnObj.offset = srcNodeIndex * this.FacesPerNode * THREE.TrailRenderer.IndicesPerFace;
		returnObj.count = this.FacesPerNode * THREE.TrailRenderer.IndicesPerFace;

		return returnObj;

	}

}();

THREE.TrailRenderer.prototype.deactivate = function() {

	if ( this.isActive ) {

		this.scene.remove( this.mesh );
		this.isActive = false;

	}

}

THREE.TrailRenderer.prototype.activate = function() {

	if ( ! this.isActive ) {

		this.scene.add( this.mesh );
		this.isActive = true;

	}

}

