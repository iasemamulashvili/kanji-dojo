import re
import sys

def main():
    print("Starting SVG processing...")
    svg_path = 'public/leaves-extract.svg'
    out_path = 'public/leaves-extract-wabi.svg'
    
    with open(svg_path, 'r', encoding='utf-8') as f:
        content = f.read()

    print("Read SVG.")

    # Replace all fill colors with Charcoal Blue
    content = re.sub(r'fill="#[A-Fa-f0-9]+"', 'fill="#3a3f4b"', content, flags=re.IGNORECASE)
    
    print("Replaced colors.")

    # Insert the SVG filter for irregularity and wrap paths in a group
    filter_def = '''
<filter id="wabi-sabi-displacement" x="-20%" y="-20%" width="140%" height="140%">
  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
</filter>
<g filter="url(#wabi-sabi-displacement)">
'''

    # Find where the first <path... starts and insert filter definition
    path_start = content.find('<path')
    if path_start != -1:
        content = content[:path_start] + filter_def + content[path_start:]
        
        # Close the <g> before </svg>
        svg_close = content.rfind('</svg>')
        if svg_close != -1:
            content = content[:svg_close] + '</g>\n' + content[svg_close:]

    print("Added filters.")

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Successfully processed SVG!')

if __name__ == "__main__":
    main()
