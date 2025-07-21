export const liquifyVertex = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform vec2 brushPosition;
uniform float brushSize;
uniform float pressure;
uniform float mode;
uniform float strength;

varying vec2 vTextureCoord;
varying vec2 vBrushDist;

void main(void) {
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
    
    // Calculate distance from brush center for fragment shader
    vec2 worldPos = aVertexPosition;
    vBrushDist = worldPos - brushPosition;
}
`

export const liquifyFragment = `
precision mediump float;

varying vec2 vTextureCoord;
varying vec2 vBrushDist;

uniform sampler2D uSampler;
uniform vec2 brushPosition;
uniform float brushSize;
uniform float pressure;
uniform float mode;
uniform float strength;
uniform float time;

vec2 applySmear(vec2 coord, vec2 dist, float effect) {
    vec2 direction = normalize(dist);
    return coord - direction * effect * 0.1;
}

vec2 applyTwirl(vec2 coord, vec2 dist, float effect) {
    float angle = effect * 3.14159 * 2.0;
    float s = sin(angle);
    float c = cos(angle);
    vec2 centered = coord - brushPosition;
    vec2 rotated = vec2(
        centered.x * c - centered.y * s,
        centered.x * s + centered.y * c
    );
    return rotated + brushPosition;
}

vec2 applyPinch(vec2 coord, vec2 dist, float effect) {
    vec2 direction = normalize(dist);
    return coord + direction * effect * 0.2;
}

vec2 applySwell(vec2 coord, vec2 dist, float effect) {
    vec2 direction = normalize(dist);
    return coord - direction * effect * 0.2;
}

void main(void) {
    vec2 coord = vTextureCoord;
    float dist = length(vBrushDist);
    
    if (dist < brushSize) {
        float effect = (1.0 - dist / brushSize) * pressure * strength;
        
        if (mode < 0.5) {
            coord = applySmear(coord, vBrushDist, effect);
        } else if (mode < 1.5) {
            coord = applyTwirl(coord, vBrushDist, effect);
        } else if (mode < 2.5) {
            coord = applyPinch(coord, vBrushDist, effect);
        } else {
            coord = applySwell(coord, vBrushDist, effect);
        }
    }
    
    gl_FragColor = texture2D(uSampler, coord);
}
`