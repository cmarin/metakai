export const convolveVertex = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform vec2 texelSize;

varying vec2 vTextureCoord;
varying vec2 vTexelSize;

void main(void) {
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
    vTexelSize = texelSize;
}
`

export const convolveFragment = `
precision mediump float;

varying vec2 vTextureCoord;
varying vec2 vTexelSize;

uniform sampler2D uSampler;
uniform float kernel[9];
uniform float intensity;

void main(void) {
    vec4 color = vec4(0.0);
    
    // Apply 3x3 convolution kernel
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y)) * vTexelSize;
            vec4 sample = texture2D(uSampler, vTextureCoord + offset);
            int index = (y + 1) * 3 + (x + 1);
            float weight = kernel[index];
            color += sample * weight;
        }
    }
    
    // Mix with original based on intensity
    vec4 original = texture2D(uSampler, vTextureCoord);
    gl_FragColor = mix(original, color, intensity);
    gl_FragColor.a = original.a;
}
`