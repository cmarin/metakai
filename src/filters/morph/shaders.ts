export const MorphShader = `
precision mediump float;

uniform sampler2D uTexture;
uniform float morphAmount;

varying vec2 vTextureCoord;

void main(void) {
    vec4 color = texture2D(uTexture, vTextureCoord);
    
    // For now, just pass through the color
    // In a real implementation, we'd need a second texture
    // and proper morphing logic
    gl_FragColor = color;
}
`