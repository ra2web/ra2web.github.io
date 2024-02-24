// Patch THREE shader chunks to support instancing

Object.assign(THREE.ShaderChunk, {
    begin_vertex: `
#ifndef INSTANCE_TRANSFORM

vec3 transformed = vec3( position );

#else

#ifndef INSTANCE_MATRIX

	mat4 _instanceMatrix = mat4(
        instanceMatrix0,
        instanceMatrix1,
        instanceMatrix2,
        instanceMatrix3
    );

	#define INSTANCE_MATRIX

#endif

vec3 transformed = ( _instanceMatrix * vec4( position , 1. )).xyz;

#endif
`,

    color_fragment: `
#ifdef USE_COLOR

	diffuseColor.rgb *= vColor;

#endif

#if defined(INSTANCE_COLOR)

	diffuseColor.rgb *= vInstanceColor;

#endif

#if defined( INSTANCE_OPACITY )

  diffuseColor.a = vInstanceOpacity * opacity;

#endif
`,

    color_pars_fragment: `

#ifdef USE_COLOR

	varying vec3 vColor;

#endif

#if defined( INSTANCE_COLOR )

	varying vec3 vInstanceColor;

#endif

#if defined( INSTANCE_OPACITY )

  varying float vInstanceOpacity;

#endif
`,

    color_vertex: `
#ifdef USE_COLOR

	vColor.xyz = color.xyz;

#endif

#if defined( INSTANCE_COLOR ) && defined( INSTANCE_TRANSFORM )

	vInstanceColor = instanceColor;

#endif

#if defined( INSTANCE_OPACITY ) && defined( INSTANCE_TRANSFORM )

	vInstanceOpacity = instanceOpacity;

#endif
`,

    defaultnormal_vertex: `
#ifdef FLIP_SIDED

	objectNormal = -objectNormal;

#endif

#ifndef INSTANCE_TRANSFORM

	vec3 transformedNormal = normalMatrix * objectNormal;

#else

	#ifndef INSTANCE_MATRIX

		mat4 _instanceMatrix = mat4(
            instanceMatrix0,
            instanceMatrix1,
            instanceMatrix2,
            instanceMatrix3
        );

		#define INSTANCE_MATRIX

	#endif

	#ifndef INSTANCE_UNIFORM

		vec3 transformedNormal =  transpose( inverse( mat3( modelViewMatrix * _instanceMatrix ) ) ) * objectNormal ;

	#else

		vec3 transformedNormal = ( modelViewMatrix * _instanceMatrix * vec4( objectNormal , 0.0 ) ).xyz;

	#endif

#endif
`,

    uv_pars_vertex:  `
#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )

  varying vec2 vUv;

  uniform mat3 uvTransform;

#endif

#ifdef INSTANCE_TRANSFORM

mat3 inverse(mat3 m) {

  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];

  float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];

  float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];

  float b01 = a22 * a11 - a12 * a21;

  float b11 = -a22 * a10 + a12 * a20;

  float b21 = a21 * a10 - a11 * a20;

  float det = a00 * b01 + a01 * b11 + a02 * b21;

  return mat3(b01, (-a22 * a01 + a02 * a21), ( a12 * a01 - a02 * a11),
              b11, ( a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),
              b21, (-a21 * a00 + a01 * a20), ( a11 * a00 - a01 * a10)) / det;
}

attribute vec4 instanceMatrix0;
attribute vec4 instanceMatrix1;
attribute vec4 instanceMatrix2;
attribute vec4 instanceMatrix3;

#if defined( INSTANCE_COLOR )
  attribute vec3 instanceColor;
  varying vec3 vInstanceColor;
#endif

#if defined( INSTANCE_OPACITY )
  attribute float instanceOpacity;
  varying float vInstanceOpacity;
#endif

mat4 getInstanceMatrix(){
  return mat4(
    instanceMatrix0,
    instanceMatrix1,
    instanceMatrix2,
    instanceMatrix3
  );
}

#endif
`,
});
