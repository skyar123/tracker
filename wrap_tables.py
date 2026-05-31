import os

files = [
    "src/components/BaselineChecklistModal.jsx",
    "src/components/SixMonthChecklistModal.jsx",
    "src/components/TerminationChecklistModal.jsx"
]

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            content = f.read()
        
        # Add overflow-x-auto wrapper to table
        if '<div className="overflow-x-auto w-full">' not in content:
            content = content.replace('<table className=', '<div className="overflow-x-auto w-full">\n              <table className=')
            content = content.replace('</table>', '</table>\n            </div>')
            
        with open(file_path, "w") as f:
            f.write(content)
        print(f"Updated {file_path}")
    else:
        print(f"Skipping {file_path}, does not exist.")
