import os
import zipfile

zip_filename = 'la-academia-fc27-deployment.zip'
exclude_dirs = {'node_modules', '.git', 'dist', '.aistudio', '__pycache__', '.vite'}
exclude_files = {zip_filename, 'bun.lockb'}

with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        for file in files:
            if file in exclude_files or file.endswith('.zip') or file.endswith('.log'):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, '.')
            zipf.write(full_path, rel_path)

print(f"Zip created successfully: {zip_filename} ({os.path.getsize(zip_filename)} bytes)")
