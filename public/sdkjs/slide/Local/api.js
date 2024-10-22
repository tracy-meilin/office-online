/*
 * (c) Copyright Ascensio System SIA 2010-2018
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at Lubanas st. 125a-25, Riga, Latvia,
 * EU, LV-1021.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

"use strict";

// Import
var c_oAscError = Asc.c_oAscError;

/////////////////////////////////////////////////////////
//////////////        OPEN       ////////////////////////
/////////////////////////////////////////////////////////
Asc['asc_docs_api'].prototype._OfflineAppDocumentStartLoad = function()
{
	this.asc_registerCallback('asc_onDocumentContentReady', function(){
		DesktopOfflineUpdateLocalName(editor);

		setTimeout(function(){window["UpdateInstallPlugins"]();}, 10);
	});

	AscCommon.History.UserSaveMode = true;
    window["AscDesktopEditor"]["LocalStartOpen"]();
};
Asc['asc_docs_api'].prototype._OfflineAppDocumentEndLoad = function(_url, _data, _len)
{
	AscCommon.g_oIdCounter.m_sUserId = window["AscDesktopEditor"]["CheckUserId"]();
	if (_data == "")
	{
		this.sendEvent("asc_onError", c_oAscError.ID.ConvertationOpenError, c_oAscError.Level.Critical);
		return;
	}

	var _binary = getBinaryArray(_data, _len);
    this.OpenDocument2(_url, _binary);
	this.WordControl.m_oLogicDocument.Set_FastCollaborativeEditing(false);
	this.DocumentOrientation = (null == this.WordControl.m_oLogicDocument) ? true : !this.WordControl.m_oLogicDocument.Orientation;
	DesktopOfflineUpdateLocalName(this);

	window["DesktopAfterOpen"](this);
};
window["DesktopOfflineAppDocumentEndLoad"] = function(_url, _data, _len)
{
	AscCommon.g_oDocumentUrls.documentUrl = _url;
	if (AscCommon.g_oDocumentUrls.documentUrl.indexOf("file:") != 0)
	{
		if (AscCommon.g_oDocumentUrls.documentUrl.indexOf("/") != 0)
			AscCommon.g_oDocumentUrls.documentUrl = "/" + AscCommon.g_oDocumentUrls.documentUrl;
		AscCommon.g_oDocumentUrls.documentUrl = "file://" + AscCommon.g_oDocumentUrls.documentUrl;
	}
	
    editor._OfflineAppDocumentEndLoad(_url, _data, _len);

	editor.sendEvent("asc_onDocumentPassword", ("" != editor.currentPassword) ? true : false);
};

/////////////////////////////////////////////////////////
//////////////        CHANGES       /////////////////////
/////////////////////////////////////////////////////////
AscCommon.CHistory.prototype.Reset_SavedIndex = function(IsUserSave)
{
	this.SavedIndex = (null === this.SavedIndex && -1 === this.Index ? null : this.Index);
	if (true === this.Is_UserSaveMode())
	{
		if (true === IsUserSave)
		{
			this.UserSavedIndex = this.Index;
			this.ForceSave      = false;
		}
	}
	else
	{
		this.ForceSave  = false;
	}
};
AscCommon.CHistory.prototype.Have_Changes = function(IsNotUserSave, IsNoSavedNoModifyed)
{
	if (true === this.Is_UserSaveMode() && true !== IsNotUserSave)
	{
		if (-1 === this.Index && null === this.UserSavedIndex && false === this.ForceSave)
		{
			if (window["AscDesktopEditor"])
			{
				if (0 != window["AscDesktopEditor"]["LocalFileGetOpenChangesCount"]())
					return true;
				if (!window["AscDesktopEditor"]["LocalFileGetSaved"]() && IsNoSavedNoModifyed !== true)
					return true;
			}
			return false;
		}

		if (this.Index != this.UserSavedIndex || true === this.ForceSave)
			return true;

		return false;
	}
	else
	{
		if (-1 === this.Index && null === this.SavedIndex && false === this.ForceSave)
			return false;

		if (this.Index != this.SavedIndex || true === this.ForceSave)
			return true;

		return false;
	}
};
	
window["DesktopOfflineAppDocumentApplyChanges"] = function(_changes)
{
	editor._coAuthoringSetChanges(_changes, new CDocumentColor( 191, 255, 199 ));
    //editor["asc_nativeApplyChanges"](_changes);
	//editor["asc_nativeCalculateFile"]();
};

/////////////////////////////////////////////////////////
////////////////        SAVE       //////////////////////
/////////////////////////////////////////////////////////
Asc['asc_docs_api'].prototype.SetDocumentModified = function(bValue)
{
    this.isDocumentModify = bValue;
    this.sendEvent("asc_onDocumentModifiedChanged");

    if (undefined !== window["AscDesktopEditor"])
    {
        window["AscDesktopEditor"]["onDocumentModifiedChanged"](AscCommon.History ? AscCommon.History.Have_Changes(undefined, true) : bValue);
    }
};

Asc['asc_docs_api'].prototype.asc_Save = function (isNoUserSave, isSaveAs)
{
    if (true !== isNoUserSave)
        this.IsUserSave = true;
	
	if (this.IsUserSave)
	{
		this.LastUserSavedIndex = AscCommon.History.UserSavedIndex;
	}

    if (true === this.canSave && !this.isLongAction())
	{
		var _isNaturalSave = this.IsUserSave;
		this.canSave = false;

		var t = this;
		this.CoAuthoringApi.askSaveChanges(function(e) {
			t._onSaveCallback(e);
		});
		
		if (this.CoAuthoringApi.onUnSaveLock)
			this.CoAuthoringApi.onUnSaveLock();
		
		if (_isNaturalSave === true)
			window["DesktopOfflineAppDocumentStartSave"](isSaveAs);
	}
};
window["DesktopOfflineAppDocumentStartSave"] = function(isSaveAs, password, isForce)
{
	window.doadssIsSaveAs = isSaveAs;
	if (true !== isForce && window.g_asc_plugins && window.g_asc_plugins.isRunned("asc.{F2402876-659F-47FB-A646-67B49F2B57D0}"))
	{
		window.g_asc_plugins.init("asc.{F2402876-659F-47FB-A646-67B49F2B57D0}", { "type" : "generatePassword" });
		return;
	}

	editor.sync_StartAction(Asc.c_oAscAsyncActionType.BlockInteraction, Asc.c_oAscAsyncAction.Save);
	
	var _param = "";
	if (isSaveAs === true)
		_param += "saveas=true;";
	if (AscCommon.AscBrowser.isRetina)
		_param += "retina=true;";
	
	window["AscDesktopEditor"]["LocalFileSave"](_param, (password === undefined) ? editor.currentPassword : password);
};
window["DesktopOfflineAppDocumentEndSave"] = function(error, hash, password)
{
	editor.sync_EndAction(Asc.c_oAscAsyncActionType.BlockInteraction, Asc.c_oAscAsyncAction.Save);
	if (0 == error)
		DesktopOfflineUpdateLocalName(editor);
	else
		AscCommon.History.UserSavedIndex = editor.LastUserSavedIndex;
	
	editor.UpdateInterfaceState();
	editor.LastUserSavedIndex = undefined;
	
	if (2 == error)
		editor.sendEvent("asc_onError", c_oAscError.ID.ConvertationSaveError, c_oAscError.Level.Critical);

	if (0 == error)
	{
		if (window.SaveQuestionObjectBeforeSign)
		{
			var _obj = window.SaveQuestionObjectBeforeSign;
			editor.sendEvent("asc_onSignatureClick", _obj.guid, _obj.width, _obj.height, window["asc_IsVisibleSign"](_obj.guid));
			window.SaveQuestionObjectBeforeSign = null;
		}
	}

	if (hash !== null && hash !== undefined && hash != "")
	{
		if (window.g_asc_plugins && window.g_asc_plugins.isRunned("asc.{F2402876-659F-47FB-A646-67B49F2B57D0}"))
		{
			window.g_asc_plugins.init("asc.{F2402876-659F-47FB-A646-67B49F2B57D0}", {"type": "setPasswordByFile", "hash": hash, "password": password});
		}
	}

	if (0 == error)
		editor.sendEvent("asc_onDocumentPassword", ("" != editor.currentPassword) ? true : false);
};
Asc['asc_docs_api'].prototype.asc_DownloadAs = function(typeFile, bIsDownloadEvent) 
{
	this.asc_Save(false, true);
};

Asc['asc_docs_api'].prototype.AddImageUrl = function(url, imgProp)
{
	var _url = window["AscDesktopEditor"]["LocalFileGetImageUrl"](url);
	this.AddImageUrlAction(AscCommon.g_oDocumentUrls.getImageUrl(_url), imgProp);
};
Asc['asc_docs_api'].prototype.AddImage = function()
{
	window["AscDesktopEditor"]["LocalFileGetImageUrlFromOpenFileDialog"]();
};
Asc['asc_docs_api'].prototype.asc_addImage = function()
{
  window["AscDesktopEditor"]["LocalFileGetImageUrlFromOpenFileDialog"]();
};
Asc['asc_docs_api'].prototype.asc_isOffline = function()
{
	return true;
};
Asc['asc_docs_api'].prototype.SetThemesPath = function(path)
{
	this.ThemeLoader.ThemesUrl = path;
	this.ThemeLoader.ThemesUrlAbs = path;
};

Asc['asc_docs_api'].prototype["asc_addImage"] = Asc['asc_docs_api'].prototype.asc_addImage;
Asc['asc_docs_api'].prototype["AddImageUrl"] = Asc['asc_docs_api'].prototype.AddImageUrl;
Asc['asc_docs_api'].prototype["AddImage"] = Asc['asc_docs_api'].prototype.AddImage;
Asc['asc_docs_api'].prototype["asc_Save"] = Asc['asc_docs_api'].prototype.asc_Save;
Asc['asc_docs_api'].prototype["asc_DownloadAs"] = Asc['asc_docs_api'].prototype.asc_DownloadAs;
Asc['asc_docs_api'].prototype["asc_isOffline"] = Asc['asc_docs_api'].prototype.asc_isOffline;
Asc['asc_docs_api'].prototype["SetDocumentModified"] = Asc['asc_docs_api'].prototype.SetDocumentModified;
Asc['asc_docs_api'].prototype["SetThemesPath"] = Asc['asc_docs_api'].prototype.SetThemesPath;

window["DesktopOfflineAppDocumentAddImageEnd"] = function(url)
{
	if (url == "")
		return;
	var _url = window["AscDesktopEditor"]["LocalFileGetImageUrl"](url);
	editor.AddImageUrlAction(AscCommon.g_oDocumentUrls.getImageUrl(_url));
};

window["on_editor_native_message"] = function(sCommand, sParam)
{
	if (!window.editor)
		return;
	
	if (sCommand == "save")
		editor.asc_Save();
	else if (sCommand == "saveAs")
		editor.asc_Save(false, true);
	else if (sCommand == "print")
		editor.asc_Print();
	else if (sCommand == "editor:stopDemonstration")
		editor.EndDemonstration(true);
};

Asc['asc_docs_api'].prototype.asc_setAdvancedOptions = function(idOption, option)
{
	if (window["Asc"].c_oAscAdvancedOptionsID.DRM === idOption) {
        var _param = "";
        _param += ("<m_sPassword>" + AscCommon.CopyPasteCorrectString(option.asc_getPassword()) + "</m_sPassword>");
		this.currentPassword = option.asc_getPassword();
        window["AscDesktopEditor"]["SetAdvancedOptions"](_param);
    }
};
Asc['asc_docs_api'].prototype["asc_setAdvancedOptions"] = Asc['asc_docs_api'].prototype.asc_setAdvancedOptions;
