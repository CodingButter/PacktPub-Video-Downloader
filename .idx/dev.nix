# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  
  # Which nixpkgs channel to use.
  channel = "stable-24.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_23 # Changed from nodejs_20
    pkgs.docker_28
    pkgs.nodePackages.pnpm
    # pkgs.pkgs.chromedriver
    pkgs.pkgs.chromium
  ];
  # Sets environment variables in the workspace
  env = {};

  services.docker.enable = true;

  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];
    workspace = {
      # Runs when a workspace is first created with this \`dev.nix\` file
      onCreate = {
        pnpm-install = "pnpm install --frozen-lockfile"; # Changed from npm ci
        # Open editors for the following files by default, if they exist:
        default.openFiles = [
          # Cover all the variations of language, src-dir, router (app/pages)
          "pages/index.tsx" "pages/index.js"
          "src/pages/index.tsx" "src/pages/index.js"
          "app/page.tsx" "app/page.js"
          "src/app/page.tsx" "src/app/page.js"
        ];
      };
      onStart = {}; # Docker compose is started by its preview command
    };
    # Enable previews and customize configuration
    previews = {
      enable = false;
      previews = {};
    };
  };
}