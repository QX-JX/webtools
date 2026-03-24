import os
import zipfile

def create_zip(source_dir, output_filename):
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                if file.lower() == 'updater.exe':
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)
                print(f"Added {arcname}")

if __name__ == '__main__':
    source = r'dist-release-1.0.1\win-unpacked'
    output = r'dist-release-1.0.1\update_1.0.1.zip'
    create_zip(source, output)
    print(f"Created {output}")
