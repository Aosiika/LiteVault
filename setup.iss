#define MyAppVersion "1.1.1"

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
CloseApplications=force
RestartApplications=yes
; Uncomment the following line to run in non administrative install mode (install for current user only.)
;PrivilegesRequired=lowest
OutputDir=.\installer
OutputBaseFilename=LiteVault_Setup_v{#MyAppVersion}
SetupIconFile=.\logo.ico
Compression=lzma2/ultra64
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

[Code]
var
  DownloadPage: TDownloadWizardPage;

function IsWebView2Installed(): Boolean;
begin
  // Comprueba tanto a nivel de máquina (HKEY_LOCAL_MACHINE) como de usuario (HKEY_CURRENT_USER)
  Result := RegKeyExists(HKEY_LOCAL_MACHINE, 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}') or 
            RegKeyExists(HKEY_CURRENT_USER, 'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}');
end;

procedure InitializeWizard();
begin
  // Creamos la página de descarga para mostrar el progreso
  DownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), SetupMessage(msgPreparingDesc), nil);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  ResultCode: Integer;
begin
  Result := True;
  
  if CurPageID = wpReady then
  begin
    if not IsWebView2Installed() then
    begin
      if MsgBox('LiteVault necesita Microsoft Edge WebView2 (el motor de interfaz gráfica oficial de Windows) para funcionar correctamente.' + #13#10 + #13#10 + '¿Quieres descargarlo e instalarlo ahora automáticamente? (Recomendado)', mbConfirmation, MB_YESNO) = IDYES then
      begin
        DownloadPage.Clear;
        DownloadPage.Add('https://go.microsoft.com/fwlink/p/?LinkId=2124703', 'MicrosoftEdgeWebview2Setup.exe', '');
        DownloadPage.Show;
        try
          try
            DownloadPage.Download;
            DownloadPage.SetText('Instalando WebView2...', '');
            
            // Ejecutamos el instalador descargado silenciosamente
            if not Exec(ExpandConstant('{tmp}\MicrosoftEdgeWebview2Setup.exe'), '/silent /install', '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
            begin
              MsgBox('Hubo un error instalando WebView2 (' + IntToStr(ResultCode) + '). Es posible que LiteVault no se abra correctamente.', mbError, MB_OK);
            end;
          except
            if DownloadPage.AbortedByUser then
              Log('Descarga cancelada por el usuario.')
            else
              MsgBox('Error descargando WebView2. Puedes instalarlo manualmente más tarde.', mbError, MB_OK);
          end;
        finally
          DownloadPage.Hide;
        end;
      end;
    end;
  end;
end;
