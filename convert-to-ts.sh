#!/bin/bash

# Script to help convert remaining JS files to TypeScript

echo "🔄 Converting JavaScript files to TypeScript..."

# Create backup directory
mkdir -p backup

# Function to backup and convert a file
convert_file() {
    local js_file=$1
    local ts_file="${js_file%.js}.ts"
    
    if [ -f "$js_file" ]; then
        echo "Converting $js_file to $ts_file"
        cp "$js_file" "backup/$(basename $js_file)"
        mv "$js_file" "$ts_file"
    fi
}

# Convert remaining JavaScript files
find src -name "*.js" -type f | while read file; do
    convert_file "$file"
done

echo "✅ File conversion complete!"
echo "📁 Original files backed up to ./backup/"
echo "⚠️  Note: You'll need to manually add TypeScript types to the converted files"
