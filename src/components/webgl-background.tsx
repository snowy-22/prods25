
'use client';

import React, { useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface WebGLBackgroundProps {
  type: string;
  className?: string;
  isPreview?: boolean;
}

const shaders: Record<string, { vs: string; fs: string }> = {
  'liquid-gradient': {
    vs: `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `,
    fs: `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      
      vec3 palette( float t ) {
          vec3 a = vec3(0.5, 0.5, 0.5);
          vec3 b = vec3(0.5, 0.5, 0.5);
          vec3 c = vec3(1.0, 1.0, 1.0);
          vec3 d = vec3(0.263,0.416,0.557);
          return a + b*cos( 6.28318*(c*t+d) );
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
        vec2 uv0 = uv;
        vec3 finalColor = vec3(0.0);

        for (float i = 0.0; i < 4.0; i++) {
            uv = fract(uv * 1.5) - 0.5;
            float d = length(uv) * exp(-length(uv0));
            vec3 col = palette(length(uv0) + i*.4 + u_time*.4);
            d = sin(d*8. + u_time)/8.;
            d = abs(d);
            d = pow(0.01 / d, 1.2);
            finalColor += col * d;
        }
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  },
  'digital-particles': {
      vs: `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `,
      fs: `
        precision mediump float;
        uniform vec2 u_resolution;
        uniform float u_time;

        float random (vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
            vec2 st = gl_FragCoord.xy/u_resolution.xy;
            st.x *= u_resolution.x/u_resolution.y;
            vec3 color = vec3(0.0);
            float d = 1.0;

            vec2 grid = floor(st * 20.0);
            vec2 ipos = st * 20.0;
            
            ipos.x += u_time * 0.2 * (random(grid)-0.5);
            ipos.y += u_time * 0.2 * (random(grid+1.0)-0.5);

            vec2 fpos = fract(ipos);
            float dist = distance(fpos, vec2(0.5));
            d = step(0.1, dist);

            color = vec3(d);
            gl_FragColor = vec4(color, 1.0);
        }
      `
  },
  'cosmic-web': {
      vs: `
          attribute vec2 a_position;
          void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
      `,
      fs: `
          precision highp float;
          uniform vec2 u_resolution;
          uniform float u_time;

          float snoise(vec3 uv) {
              return fract(sin(dot(uv, vec3(12.9898, 78.233, 151.7182))) * 43758.5453) * 2.0 - 1.0;
          }

          float fbm(vec3 uv) {
              float f = 0.0;
              mat3 m = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
              f += 0.5000 * snoise(uv); uv = m * uv;
              f += 0.2500 * snoise(uv); uv = m * uv;
              f += 0.1250 * snoise(uv); uv = m * uv;
              f += 0.0625 * snoise(uv); uv = m * uv;
              return f;
          }

          void main() {
              vec2 p = (2.0 * gl_FragCoord.xy - u_resolution) / min(u_resolution.x, u_resolution.y);
              vec3 uv = vec3(p, u_time * 0.1);
              float noise = fbm(uv);
              float color = smoothstep(0.4, 0.6, noise);
              gl_FragColor = vec4(vec3(color), 1.0);
          }
      `
  },
  'aurora': {
    vs: `
        attribute vec2 a_position;
        void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `,
    fs: `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        #define PI 3.14159265359

        float random(vec2 p) {
            return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            float t = u_time * 0.1;
            
            vec2 p = uv * 2.0 - 1.0;
            p.x *= u_resolution.x / u_resolution.y;

            float len = length(p);
            float angle = atan(p.y, p.x);
            
            float n = noise(vec2(angle * 2.0, t * 0.5));
            n += noise(vec2(len * 2.0, t * 0.5)) * 0.5;

            float intensity = smoothstep(0.45, 0.55, abs(0.5-fract(n + t * 0.1)));
            
            vec3 col1 = vec3(0.1, 0.0, 0.3);
            vec3 col2 = vec3(0.0, 0.3, 0.5);
            vec3 col3 = vec3(0.5, 0.0, 0.3);

            vec3 color = mix(col1, col2, smoothstep(0.4, 0.6, p.y + 1.0));
            color = mix(color, col3, n);

            gl_FragColor = vec4(color + vec3(intensity * 0.5, intensity * 0.8, intensity * 1.0), 1.0);
        }
    `
    },
    'holographic': {
        vs: `
            attribute vec2 a_position;
            void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
        `,
        fs: `
            precision highp float;
            uniform vec2 u_resolution;
            uniform float u_time;
            
            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
                float t = u_time * 0.2;
                
                uv.y += sin(uv.x * 10.0 + t) * 0.05;
                uv.x += cos(uv.y * 10.0 + t) * 0.05;

                float r = length(uv * 1.5);
                float a = atan(uv.y, uv.x);
                
                float f = cos(a * 3.0) * cos(a*2.0);
                f = 1.0 - pow(abs(f), 0.1);
                
                float d = length(uv);
                vec3 col = vec3(
                    0.5 + 0.5 * cos(t + a + d * 4.0),
                    0.5 + 0.5 * cos(t + a + d * 4.0 + 2.0),
                    0.5 + 0.5 * cos(t + a + d * 4.0 + 4.0)
                );
                
                col *= f;
                col *= 1.0 - smoothstep(0.4, 0.6, r);
                
                float scanline = sin(gl_FragCoord.y * 1.5 + u_time * 5.0) * 0.05;
                col -= scanline;
                
                gl_FragColor = vec4(col, 1.0);
            }
        `
    },
    'plasma-orb': {
        vs: `
            attribute vec2 a_position;
            void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
        `,
        fs: `
            precision highp float;
            uniform vec2 u_resolution;
            uniform float u_time;
            
            float plasma(vec2 p) {
                float val = 0.0;
                val += sin(p.x * 2.0 + u_time);
                val += sin(p.y * 2.0 - u_time);
                val += sin((p.x + p.y) * 2.0 + u_time);
                val += sin(sqrt(p.x*p.x + p.y*p.y) * 3.0 - u_time);
                return val / 4.0;
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                uv -= 0.5;
                uv.x *= u_resolution.x / u_resolution.y;

                float p = plasma(uv * 5.0);
                vec3 col = vec3(
                    0.5 + 0.5 * sin(3.14 * p + u_time),
                    0.5 + 0.5 * sin(3.14 * p + 2.094 + u_time),
                    0.5 + 0.5 * sin(3.14 * p + 4.188 + u_time)
                );

                float d = length(uv);
                float orb = 1.0 - smoothstep(0.3, 0.31, d);
                
                gl_FragColor = vec4(col * orb, 1.0);
            }
        `
    },
};

const WebGLBackground: React.FC<WebGLBackgroundProps> = ({ type, className, isPreview = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: isPreview });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    
    const shader = shaders[type];
    if (!shader) {
        console.error(`Shader type "${type}" not found.`);
        return;
    }

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, shader.vs);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, shader.fs);
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const startTime = Date.now();
    let parentElement = canvas.parentElement;

    const resize = () => {
        if (!parentElement) parentElement = canvas.parentElement;
        if (parentElement) {
            canvas.width = parentElement.clientWidth;
            canvas.height = parentElement.clientHeight;
        }
    }

    const render = () => {
      const now = Date.now();
      const time = (now - startTime) * 0.001;
      
      resize();

      const resUniform = gl.getUniformLocation(program, 'u_resolution');
      const timeUniform = gl.getUniformLocation(program, 'u_time');
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(resUniform, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(timeUniform, time);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!isPreview) {
        animationFrameId.current = requestAnimationFrame(render);
      }
    };
    
    const resizeObserver = new ResizeObserver(render);
    if(parentElement) {
        resizeObserver.observe(parentElement);
    }
    
    if (isPreview) {
      setTimeout(render, 100);
    } else {
      render();
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if(parentElement) {
        resizeObserver.unobserve(parentElement);
      }
    };
  }, [type, isPreview]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0', className)}
    />
  );
};

export default memo(WebGLBackground);
