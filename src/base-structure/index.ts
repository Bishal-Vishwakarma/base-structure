import { normalize, strings, virtualFs, workspaces } from '@angular-devkit/core';
import { apply, applyTemplates, chain, mergeWith, move, Rule, SchematicsException, Tree, url } from '@angular-devkit/schematics';

/**
 * To use `workspaces.readWorkspace` this method is created to get workspaces.WorkspaceHost from the Tree
 * @param tree 
 */
function createHost(tree: Tree): workspaces.WorkspaceHost {
  return {
    async readFile(path: string): Promise<string> {
      const data = tree.read(path);
      if (!data) {
        throw new SchematicsException('File not found.');
      }
      return virtualFs.fileBufferToString(data);
    },
    async writeFile(path: string, data: string): Promise<void> {
      return tree.overwrite(path, data);
    },
    async isDirectory(path: string): Promise<boolean> {
      return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
    },
    async isFile(path: string): Promise<boolean> {
      return tree.exists(path);
    },
  };
}

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function baseStructure(options: any): Rule {
  return async (tree: Tree) => {
    const host = createHost(tree);
    const { workspace } = await workspaces.readWorkspace('/', host);
    // choose the default project as the project to apply our schematics on
    options.project = workspace.extensions.defaultProject;
    const project = workspace.projects.get(options.project);
    // throw error if we are not inside any project
    if (!project) {
      throw new SchematicsException(`Invalid project name: ${options.project}`);
    }
    // set the project type to create the path to put our changes in
    const projectType = project.extensions.projectType === 'application' ? 'app' : 'lib';
    options.path = `./${project.sourceRoot}/${projectType}`;
    // apply changes to our template
    const templateSource = apply(url(`./files/${options.type}-structure`), [
      applyTemplates({
        classify: strings.classify,
        dasherize: strings.dasherize,
        type: options.type
      }),
      // move the generated template to destination path
      move(normalize(options.path as string))
    ]);

    return chain([
      mergeWith(templateSource)
    ]);
  };
}
