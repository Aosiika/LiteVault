#define MyAppVersion "1.0.0"

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in installers for other applications.
AppId={{5D3C4F8B-A3B6-4E9A-90F3-7C812A6E9B4D}
AppName=LiteVault
AppVersion={#MyAppVersion}
AppPublisher=Aosika
AppPublisherURL=https://github.com/Aosiika/LiteVault
AppSupportURL=https://github.com/Aosiika/LiteVault
AppUpdatesURL=https://github.com/Aosiika/LiteVault
DefaultDirName={autopf}\LiteVault
DisableProgramGroupPage=yes
; Uncomment the following line to run in non administrative install mode (install for current user only.)
;PrivilegesRequired=lowest
OutputDir=.\installer
OutputBaseFilename=LiteVault_Setup_v{#MyAppVersion}
SetupIconFile=.\logo.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
LicenseFile=.\license.txt

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: ".\dist\LiteVault.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\LiteVault"; Filename: "{app}\LiteVault.exe"
Name: "{autodesktop}\LiteVault"; Filename: "{app}\LiteVault.exe"; Tasks: desktopicon

[Run]
Filename: "https://github.com/Aosiika/LiteVault"; Description: "Visitar el Repositorio de GitHub de LiteVault"; Flags: shellexec runasoriginaluser postinstall unchecked
Filename: "{app}\LiteVault.exe"; Description: "{cm:LaunchProgram,LiteVault}"; Flags: nowait postinstall skipifsilent
